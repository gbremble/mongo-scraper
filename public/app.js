// when an article is clicked (or rather a <p> tag)
$(document).on('click', 'p', () => {
    // empty the notes section
    $('#notes').empty();
    // save the ID from the article that was clicked
    const thisId = $(this).attr('data-id');

    $.ajax({
        method: 'GET',
        url: `/articles/${thisId}`,
    })
        // now populate the notes section
        .then((data) => {
            console.log(data);
            // The title of the article
            $('#notes').append(`<h2>${data.title}</h2>`);
            // An input to enter a new title
            $('#notes').append('<input id="titleinput" name="title" >');
            // A textarea to add a new note body
            $('#notes').append('<textarea id="bodyinput" name="body"></textarea>');
            // A button to submit a new note, with the id of the article saved to it
            $('#notes').append(`<button data-id="${data._id}" id="savenote">Save Note</button>`);

            // If there's a note in the article
            if (data.note) {
                // Place the title of the note in the title input
                $('#titleinput').val(data.note.title);
                // Place the body of the note in the body textarea
                $('#bodyinput').val(data.note.body);
            }
        });
});

// When you click the savenote button
$(document).on('click', '#savenote', () => {
    // Grab the id associated with the article from the submit button
    const thisId = $(this).attr('data-id');

    // Run a POST request to change the note, using what's entered in the inputs
    $.ajax({
        method: 'POST',
        url: `/articles/${thisId}`,
        data: {
            // Value taken from title input
            title: $('#titleinput').val(),
            // Value taken from note textarea
            body: $('#bodyinput').val(),
        },
    })
        // With that done
        .then((data) => {
            // Log the response
            console.log(data);
            // Empty the notes section
            $('#notes').empty();
        });

    // Also, remove the values entered in the input and textarea for note entry
    $('#titleinput').val('');
    $('#bodyinput').val('');
});
