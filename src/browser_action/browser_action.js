function issuesFromStorage() {
    var deferred = $.Deferred();
    chrome.storage.local.get("issues", function(items) {
        chrome.storage.local.get(items["issues"], function(issues) {
            if (items["issues"]) {
                var allIssues = $.map(items["issues"], function(issue_key) {
                    return issues[issue_key];
                });
                allIssues.sort(function(a, b) {
                    if (a.latestChangeDate > b.latestChangeDate) {
                        return -1;
                    }
                    if (a.latestChangeDate < b.latestChangeDate) {
                        return 1;
                    }
                    return 0;
                });
                deferred.resolve(allIssues);
            }
        });
    });
    return deferred.promise();
};

var IssueList = React.createClass({
    displayName: "IssueList",
    render: function() {
        function createIssue(issue, index) {
            return React.createElement(Issue, {
                key: issue.url,
                owner: issue.repository.owner.login,
                repo: issue.repository.name,
                number: issue.number,
                title: issue.title,
                status: issue.state,
                html_url: issue.html_url,
                commitStatuses: issue.latestCommitStatuses
            });
        };
        return React.createElement(
            "div", {id: "queue", className: "list-issues"},
            this.props.issues.filter(function(issue, idx) {return !issue.hidden;}).map(createIssue)
        )
    }
});

var Issue = React.createClass({
    displayName: "Issue",
    render: function() {
        return React.createElement(
            "div", {className: "issue", onClick: this.handleClick},
            React.createElement(
                "span", {className: "issue-link"},
                React.createElement(IssueDetails, {
                    owner: this.props.owner,
                    repo: this.props.repo,
                    number: this.props.number,
                    title: this.props.title
                }),
                React.createElement(IssueStatus, {
                    status: this.props.status,
                    commitStatuses: this.props.commitStatuses
                })
            )
        );
    },
    handleClick: function(event) {
        chrome.tabs.create({url: this.props.html_url});
    }
});

var IssueDetails = React.createClass({
    displayName: "IssueDetails",
    render: function() {
        return React.createElement(
            "div", {className: "issue-details"},
            React.createElement("span", {className: "issue-repo-owner"}, this.props.owner),
            React.createElement("span", {className: "issue-repo"}, this.props.repo),
            React.createElement("span", {className: "issue-number"}, this.props.number),
            React.createElement("span", {className: "issue-title"}, this.props.title)
        );
    }
});

var IssueStatus = React.createClass({
    displayName: "IssueStatus",
    render: function() {
        var displayStatus = this.getDisplayStatus();
        return React.createElement(
            "div", {className: this.cssClasses(displayStatus)},
            React.createElement("span", {className: this.iconCssClasses(displayStatus)})
        )
    },
    getDisplayStatus: function() {
        var displayStatus = "success";
        for (var i = 0; i < this.props.commitStatuses.length; i++) {
            var state = this.props.commitStatuses[i].state;
            switch(state) {
                case "failure":
                    displayStatus = state;
                    break;
                case "pending":
                    if (displayStatus != "failure") {
                        displayStatus = state;
                    }
                    break;
                default:
                    break;
            }
        }
        return displayStatus;
    },
    cssClasses: function(displayStatus) {
        var classes = ["issue-status", "state-" + this.props.status];
        testResultClasses = {
            success: "tests-passed",
            failure: "tests-failed",
            pending: "tests-running"
        };
        classes.push(testResultClasses[displayStatus]);
        return classes.join(" ");
    },
    iconCssClasses: function(displayStatus) {
        var classes = ["issue-status-icon"];
        if (displayStatus == "pending") {
            classes.push("animated");
            classes.push("infinite");
            classes.push("flash");
        }
        return classes.join(" ")
    }
});

reactRootElement = null;
setOfIssuesHasChanged = false

issuesFromStorage().done(function(issues) {
    reactRootElement = React.createElement(IssueList, {issues: issues});
    React.render(reactRootElement, document.getElementById("queue"));
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace == "local" && "issues" in changes) {
        setOfIssuesHasChanged = true;
    }
});

function gatherUpdatesFromStorage() {
    if (!reactRootElement || !setOfIssuesHasChanged) {
        return;
    }
    issuesFromStorage().done(function(issues) {
        reactRootElement.props.issues = issues;
        setOfIssuesHasChanged = false;
    });
}

setInterval(gatherUpdatesFromStorage, 30 * 1000);
