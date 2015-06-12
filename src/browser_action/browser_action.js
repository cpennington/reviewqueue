chrome.extension.sendMessage({action: 'getQueue'}, function(response) {
    queue = $('#queue');
    $.each(response, function(idx, issue) {
        number = $('<span class="number">').append(issue.number);
        title = $('<span class="title">').append(issue.title);
        link = $('<a>', {href: issue.html_url}).append(number).append(title);
        section = $('<div>').append(link);
        queue.append(section);
    })
});