const socket = io();

//Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

//Templates
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix : true });

const autoScroll = () => {
    //New message element
    const $newMessage = $messages.lastElementChild;

    //Height of the last message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    //Visible height
    const visibleHeight = $messages.offsetHeight;

    //Height of messages container
    const containerHeight = $messages.scrollHeight;

    //How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight;
    }

    //console.log(newMessageMargin);
    
};

socket.on('locationMessage', url => {
    //console.log(url);
    const html = Mustache.render(locationTemplate, {
        username : url.username,
        url : url.url,
        createdAt : moment(url.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('message', message => {
    //console.log(message);
    const html = Mustache.render(messageTemplate, { 
        username : message.username,
        message : message.text,
        createdAt : moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
    
});

$messageForm.addEventListener('submit', e => {
    e.preventDefault();
    //Disable the form button
    $messageFormButton.setAttribute('disabled', 'disabled');
    const message = e.target.elements.message.value;
    socket.emit('sendMessage', message, (error) => {
        //Enable the form button
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();
        if(error){
            return console.log(error);
        }
        console.log('Message delivered!');
        
    });
});

$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('Geolocation is supported by your browser!');
    }

    $sendLocationButton.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition( position => {
        const location = { latitude : position.coords.latitude, longitude : position.coords.longitude };
        socket.emit('sendLocation', location, () => {
            console.log('Location shared');
            $sendLocationButton.removeAttribute('disabled');
        });
        
    });
});

socket.emit('join', { username, room }, error => {
    if(error){
        alert(error);
        location.href = '/';
    }
});
