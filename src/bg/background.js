// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

var settings = new Store("settings", {});

// ALLOWED_FILTERS = ('milestone', 'state', 'assignee', 'mentioned', 'labels')

// def commit_date(commit):
//     return datetime.strptime(
//         commit.to_json()['commit']['committer']['date'],
//         '%Y-%m-%dT%H:%M:%SZ'
//     ).replace(tzinfo=UTC)

// def main(args=None):
//     parser = ArgumentParser()
//     parser.add_argument('--config', default="~/.git-gardener.yaml")
//     parser.add_argument('-m', '--mark')

//     args = parser.parse_args(args)
//     list(args)

// def list(args):
//     gh = GitHub()

//     cfg_vars = yaml.safe_load(open(expanduser(args.config)))

//     username = cfg_vars.get('username')
//     if username is None:
//         print "Set username in your config file"
//         return 1

//     token = cfg_vars.get('token')
//     if username is None:
//         print "Set token in your config file"
//         return 1

//     filters = {
//         key[7:]: value
//         for key, value in cfg_vars.items()
//         if key.startswith('filter-')
//     }

//     for filter in filters:
//         if filter not in ALLOWED_FILTERS:
//             print "{!r} is not an allowed filter".format(filter)

//     filters = {
//         key: value
//         for key, value in filters.items()
//         if key in ALLOWED_FILTERS
//     }

//     gh.login(username, token=token)

//     repos = cfg_vars.get('repos', [])

//     if repos:
//         issues = itertools.chain.from_iterable(
//             gh.iter_repo_issues(*repo.split(':', 1), **filters)
//             for repo in repos
//         )
//     else:
//         filter_map = {
//             'mentioned': 'mentioned',
//             'assignee': 'assigned',
//         }
//         for repo_filter, global_filter in filter_map.items():
//             if repo_filter in filters:
//                 filter = global_filter
//                 filters.pop(repo_filter)
//         filters.pop('milestone', None)

//         issues = gh.iter_issues(filter, **filters)

//     for issue in issues:
//         if not issue.pull_request:
//             continue

//         owner, repo = issue.repository
//         pr = gh.repository(owner, repo).pull_request(issue.number)

//         comments = sorted(pr.iter_comments(), key=attrgetter('updated_at'), reverse=True)
//         issue_comments = sorted(pr.iter_issue_comments(), key=attrgetter('updated_at'), reverse=True)
//         commits = sorted(pr.iter_commits(), key=commit_date, reverse=True)

//         latest_data = []
//         if comments:
//             latest_data.append((comments[0].updated_at, comments[0].user.login))

//         if issue_comments:
//             latest_data.append((issue_comments[0].updated_at, issue_comments[0].user.login))

//         if commits:
//             latest_data.append((commit_date(commits[0]), commits[0].committer_as_User().login))

//         if not latest_data:
//             continue

//         latest_date, latest_user = max(latest_data)

//         if latest_user != username:
//             print pr.html_url

function getIssues(callback) {
    params = $.param({
        'q': 'involves:cpennington is:open',
        'type': 'issues'
    })
    $.ajax(
        'https://api.github.com/search/issues?' + params
    ).done(callback);
}

function storeIssues(issues, textStatus, jqXHR) {
    console.log(JSON.stringify(issues));
}

//example of using a message handler from the inject scripts
chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    getIssues(function(issues, textStatus, jqXHR) {
        sendResponse(issues.items);
    });
    return true;
  }
);
