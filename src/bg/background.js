// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

var settings = new Store("settings", {});
var requiredKeys = ['number', 'title', 'html_url']

// latest_data = []
// if comments:
// latest_data.append((comments[0].updated_at, comments[0].user.login))

// if issue_comments:
// latest_data.append((issue_comments[0].updated_at, issue_comments[0].user.login))

// if commits:
// latest_data.append((commit_date(commits[0]), commits[0].committer_as_User().login))

// if not latest_data:
// continue

// latest_date, latest_user = max(latest_data)

function storageKey(endpoint, params) {
    return JSON.stringify({
        endpoint: endpoint,
        params: params,
    });
}

function _githubAPICall(url) {
    // TODO: Update etag in local storage
    var etagKey = 'ETAG-' + url;
    var deferred = $.Deferred();

    chrome.storage.local.get(etagKey, function(etags) {
        $.ajax(
            url,
            {
                headers: {
                    'Authorization': 'Basic ' + btoa(settings.get('username') + ':' + settings.get('apikey')),
                    'If-None-Match': etags[etagKey],
                }
            }
        ).done(function(response, text_status, jqXHR) {
            chrome.storage.local.set({
                etagKey: jqXHR.getResponseHeader('ETag')
            });
        }).done(deferred.resolve);
    });

    return deferred.promise()
}

/*
 * parse_link_header()
 *
 * Parse the Github Link HTTP header used for pageination
 * http://developer.github.com/v3/#pagination
 * from: https://gist.github.com/niallo/3109252
 */
function parse_link_header(header) {
    if (header.length == 0) {
        throw new Error("input must not be of zero length");
    }
    
    // Split parts by comma
    var parts = header.split(',');
    var links = {};
    // Parse each part into a named link
    $.each(parts, function(idx, p) {
        var section = p.split(';');
        if (section.length != 2) {
            throw new Error("section could not be split on ';'");
        }
        var url = section[0].replace(/<(.*)>/, '$1').trim();
        var name = section[1].replace(/rel="(.*)"/, '$1').trim();
        links[name] = url;
    });
    
    return links;
}

function _githubAPIAllPages(url) {
    var deferred = $.Deferred();
    var items = [];

    function addPage(url) {
        return _githubAPICall(url).done(function(onePage, textStatus, jqXHR) {
            $.extend(items, onePage);
        }).done(function(onePage, textStatus, jqXHR) {
            linkHeader = jqXHR.getResponseHeader('Link');
            if (linkHeader) {
                links = parse_link_header(linkHeader);
                if (links.next) {
                    return addPage(links.next);
                }
            }

            return deferred.resolve(items);
        });
    }

    addPage(url);

    return deferred.promise()
}

function githubAPI(endpoint, params, allPages) {
    // Request from endpoint, passing etags and recording etags
    // Request all following pages
    // Store updated results in local storage
    // Return a promise that will resolve with all values

    params = $.extend({per_page: 100}, params);

    var query = $.param(params);

    var url = 'https://api.github.com/' + endpoint + '?' + query;

    if (allPages) {
        results = _githubAPIAllPages(url);
    } else {
        results = _githubAPICall(url);
    }
    return results;
}

function addLatestIssueComment(issue) {
    var owner = issue.repository.owner.login;
    var repo = issue.repository.name;
    var number = issue.number;

    return issueComments(owner, repo, number).done(function(comments) {
        comments.sort(function(a, b) {
            if (a.updated_at > b.updated_at) {
                return -1;
            }
            if (a.updated_at < b.updated_at) {
                return 1;
            }
            return 0;
        });
        issue.latestIssueComment = comments[0];
    });
}

function addLatestReviewComment(issue) {
    var owner = issue.repository.owner.login;
    var repo = issue.repository.name;
    var number = issue.number;

    if (issue.pull_request) {
        return reviewComments(owner, repo, number).done(function(comments) {
            comments.sort(function(a, b) {
                if (a.updated_at > b.updated_at) {
                    return -1;
                }
                if (a.updated_at < b.updated_at) {
                    return 1;
                }
                return 0;
            });
            issue.latestReviewComment = comments[0];
        });
    }
}

function addLatestCommit(issue) {
    var owner = issue.repository.owner.login;
    var repo = issue.repository.name;
    var number = issue.number;

    if (issue.pull_request) {
        return commits(owner, repo, number).done(function(commits) {
            commits.sort(function(a, b) {
                if (a.commit.committer.date > b.commit.committer.date) {
                    return -1;
                }
                if (a.commit.committer.date < b.commit.committer.date) {
                    return 1;
                }
                return 0;
            });
            issue.latestCommit = commits[0];
        });
    }
}

function addLatestCommitStatus(issue) {
    var owner = issue.repository.owner.login;
    var repo = issue.repository.name;
    if (!issue.latestCommit) {
        issue.latestCommitStatuses = [];
        return;
    }
    var commitSha = issue.latestCommit.sha;

    return statuses(owner, repo, commitSha).done(function(statusResponse) {
        issue.latestCommitStatuses = statusResponse.statuses;
    });
}

function markHidden(issue) {
    var latestChange = null;
    var latestUser = null;

    function laterDate(date, user) {
        if (!latestChange || (date && date >= latestChange)) {
            latestChange = date;
            latestUser = user;
        }
    }
    if (issue.latestIssueComment) {
        laterDate(issue.latestIssueComment.updated_at, issue.latestIssueComment.user.login);
    }
    if (issue.latestReviewComment) {
        laterDate(issue.latestReviewComment.updated_at, issue.latestReviewComment.user.login);
    }
    if (issue.latestCommit) {
        var user = null;
        // We might not be able to find a github user for the commit
        if (issue.latestCommit.committer) {
            user = issue.latestCommit.committer.login;
        }
        laterDate(issue.latestCommit.commit.committer.date, user);
    }

    issue.latestChangeDate = latestChange
    issue.hidden = latestUser == settings.get('username');
}


function updateIssuesList() {
    console.log("Updating issues");
    githubAPI(
        'issues',
        {
            'filter': 'mentioned',
            'type': 'issues',
            'sort': 'updated',
            'per_page': 100,
        },
        true
    ).done(function(issues) {
        console.log("Recieved issues from GitHub");
        console.log(issues)
        var issueIds = $.map(issues, function(issue) {
            return issue.html_url;
        });
        chrome.storage.local.set({issues: issueIds});
        chrome.storage.local.get(issueIds, function(storedIssues) {
            $.each(issues, function(idx, issue) {
                console.log("Starting processing of issue" + issue.url);
                $.when(
                    addLatestCommit(issue).then(addLatestCommitStatus(issue)),
                    addLatestIssueComment(issue),
                    addLatestReviewComment(issue)
                ).done(function() {
                    console.log("Finished processing of issue" + issue.url);
                    markHidden(issue);

                    var data = {};
                    data[issue.html_url] = issue;
                    chrome.storage.local.set(data);
                });
            });
        });
    });
}

function issueComments(owner, repo, issue, params) {
    // Request updated issue comments from github
    // Return a deferred that will resolve with all issues comments

    return githubAPI(
        'repos/' + owner + '/' + repo + '/issues/' + issue + '/comments',
        params,
        true
    );
}

function reviewComments(owner, repo, issue, params) {
    // Request updated review comments from github
    // Return a deferred that will resolve with all review comments

    return githubAPI(
        'repos/' + owner + '/' + repo + '/pulls/' + issue + '/comments',
        params,
        true
    );
}

function commits(owner, repo, issue, params) {
    // Request updated commits from github
    // Return a deferred that will resolved with all commits
    return githubAPI(
        'repos/' + owner + '/' + repo + '/pulls/' + issue + '/commits',
        params,
        true
    );
}

function statuses(owner, repo, commitSha, params) {
    // Request updated commits from github
    // Return a deferred that will resolved with all statuses for this commit
    return githubAPI(
        'repos/' + owner + '/' + repo + '/commits/' + commitSha + '/status',
        params,
        false
    );
}

updateIssuesList();
setInterval(updateIssuesList, 5 * 60 * 1000);
