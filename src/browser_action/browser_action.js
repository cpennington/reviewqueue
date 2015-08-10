function issuesFromStorage() {
    var deferred = $.Deferred();
    chrome.storage.local.get("issues", function(items) {
        chrome.storage.local.get(items["issues"], function(issues) {
            if (items["issues"]) {
                deferred.resolve(
                    $.map(items["issues"], function(issue_key) {
                        return issues[issue_key];
                    })
                );
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
                html_url: issue.html_url
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
                    status: this.props.status
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
        return React.createElement(
            // NOTE (@talbs): Cale, styling is expecting class names for states (state-open = open, state-closed = closed, state-merged = merged, tests-passed = pass, tests-failed = failed, tests-running = running). Also, Text values for PR/Issue state and tests state, while  should change as well (Tests Passed, Tests Failed, Tests Running. Need help with wiring, plz.
            "div", {className: "issue-status state-open tests-running"},
            // NOTE (@talbs): Cale, I needed a DOM element to show the visual icon status. Also, I need animate.css-based HTML classes (animated infinite pulse) attached to this when tests are running.
            React.createElement("span", {className: "issue-status-icon"}),
            React.createElement(
                "span", {className: "issue-status-value"},
                React.createElement("span", {className: "issue-state"}, this.props.status)
            )
        )
    }
});

issuesFromStorage().done(function(issues) {
    React.render(React.createElement(IssueList, {issues: issues}), document.getElementById("queue"));
});
