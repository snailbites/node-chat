var socket = io.connect();

// helper funcs
function displayMsg(msg, pseudo){
    var formattedMsg = formatMsg(msg);
    $('#chatEntries').find('.last').removeClass('last');
    $('#chatEntries').append(
        '<div class="message last"><span class="pseudo">'
        + pseudo
        + '</span>: <span class="msg">' + formattedMsg + '</span></div>'
    );
    $("#chatEntries").scrollTop($("#chatEntries")[0].scrollHeight);
}
function sendMsg() {
    if( $('#messageInput').val() !== ''){
        socket.emit('message', $('#messageInput').val());
        displayMsg($('#messageInput').val(), 'Me');
        $('#messageInput').val('');
    }
}

function playSound(){
    var sound = new Audio('/sounds/beep.mp3'); // buffers automatically when created
    sound.play();
}

function formatMsg(msg){
    // string must have no spaces and end in a valid image extension
    var imagePattern = new RegExp(/^([\S]+)\.(gif|jpg|jpeg|tiff|png)$/i);
    // string must begin with http:// or https://
    var linkPattern = new RegExp("^(http|https)://", "i");
    var message;
    if(imagePattern.test(msg)){
        message = '<img src="' + msg + '"/>';        
    } else if (linkPattern.test(msg)) {
        message = '<a href="' + msg + '" target="_blank">' + msg + '</a>';        
    } else {        
        message = sanitizeHtml(msg)
    }
    return message;
}

// TODO: load this via browserify
function sanitizeHtml (string) {
  return string.replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&#39;')
}

function postMsgImage($form){
    var data = new FormData($form[0]);
    var url = $form.attr('action');
    //console.log(url);
    var jqxhr = $.ajax({
        url: url,
        type: 'POST',
        data: data,
        processData: false,
        contentType: false
    })
    .always(function(){
        $form.find('input[type=file]').val('');
    })
    .done(function(data){
        var message = data.message;
        console.log(data);
        socket.emit('message', data.url);
        displayMsg(data.url, 'Me');
    })
    .fail(function(){
        alert('post error');
    });
}

// set up events
socket.on('connect', function() {
    console.log("Welcome to Vince's chat server!");
});
socket.on('welcome', function(data){
    console.log('welcome')
    $('#chatEntries').append('<div class="welcome message"><em>' + data['pseudo'] + ' has entered the room.</em></div>');
    $('#userlist').append('<p class="' + data['pseudo'] + '"">' + data['pseudo'] + '</p>');
});
socket.on('disconnect', function(data){
    console.log('disconnect')
    $('#chatEntries').append('<div class="welcome message"><em>' + data['pseudo'] + ' has left the room.</em></div>');
    $('.' + data['pseudo']).remove();
});

socket.on('message', function(data){
    displayMsg(data['message'], data['pseudo']);
    playSound();

    $(window).focus(function(){
        window.clearInterval(intervalID);
        document.title = "Team Central Chat";
    });

    var $pseudo = $('#chatEntries').find('.last').find('.pseudo').text(),
        $msg = $('#chatEntries').find('.last').find('.msg').text(),
        docTitle = false,
        intervalID = setInterval(function(){
        if(!docTitle){
            docTitle = true;
            document.title = $pseudo + " - " + $msg;
        }
        else {
            docTitle = false;
            document.title = "Team Central Chat";
        }
    }, 1000);
});

// attach events
$(function(){
    $('#submit').click(function(){
        sendMsg();
    });
    $('#messageImage').submit(function(e){
        e.preventDefault();
        var $this = $(this);
        if($this.find('input[type=file]').val() !== '') postMsgImage($this);
    });
    $('input').bind('keyup',function(e){
        var $this = $(this);
        if(e.which === 13){
            $this.parents().find('button').click();
        }
    });
    $('#beep').click(function(e){
        e.preventDefault();

    })
});
