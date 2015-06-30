chrome.extension.sendMessage({action: 'getQueue'}, function(response) {
    queue = $('#queue');
    $.each(response, function(issueId, issue) {
        number = $('<span class="number">').append(issue.number);
        title = $('<span class="title">').append(issue.title);
        link = $('<a>', {href: issue.html_url}).append(number).append(':').append(title);
//        link.click(function() {
//            chrome.tabs.create({url: issue.html_url});
//        });
        section = $('<div class="issue">').append(link);
        queue.append(section);
    })
});
