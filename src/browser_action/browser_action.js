chrome.extension.sendMessage({action: 'getQueue'}, function(response) {
    queue = $('#queue');
    $.each(response, function(issueId, issue) {
        repo = $('<span class="issue-repo">').append(issue.repository.name);
        repo_owner = $('<span class="issue-repo-owner">').append(issue.repository.owner.login);
        state = $('<span class="issue-state">').append(issue.state);
        number = $('<span class="issue-number">').append(issue.number);
        title = $('<span class="issue-title">').append(issue.title);
        issue_details = $('<div class="issue-details">').append(repo_owner).append(repo).append(number).append(title);

        // NOTE (@talbs): Cale, I needed a DOM element to show the visual icon status. Also, I need animate.css-based HTML classes (animated infinite pulse) attached to this when tests are running.
        issue_status_icon = ('<span class="issue-status-icon">');
        issue_status_value = $('<span class="issue-status-value">').append(state);

        // NOTE (@talbs): Cale, styling is expecting class names for states (state-open = open, state-closed = closed, state-merged = merged, tests-passed = pass, tests-failed = failed, tests-running = running). Also, Text values for PR/Issue state and tests state, while  should change as well (Tests Passed, Tests Failed, Tests Running. Need help with wiring, plz.
        issue_status = $('<div class="issue-status state-open tests-running">').append(issue_status_icon).append(issue_status_value)
        link = $('<a class="issue-link">').attr("href", issue.html_url).append(issue_details).append(issue_status);
//        link.click(function() {
//            chrome.tabs.create({url: issue.html_url});
//        });
        section = $('<div class="issue">').append(link);
        queue.append(section);
    })
});
