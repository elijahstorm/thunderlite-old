const ICON = document.getElementById('chat-icon');
const HOLDER = document.getElementById('main-holder');

let chat_open = false;
let first_open = true;
let notification = false;
let PARENT;

window.onload = function() {
	PARENT = window.parent.shrinkChat==null ? window.top.parent :	window.parent;
};

function jump(i){
	if(i<0)
	{
		parent.style.opacity = .45;
		if(!chat_open)
			PARENT.shrinkChat();
		return;
	}
	parent.style.bottom = "50px";
	setTimeout(function() {
		parent.style.bottom = "5px";
		setTimeout(function() {
			jump(i-1);
		}, 300);
	}, 300);
}

function openChat(){
	if(first_open)
	{
		first_open = false;
		parent = document.getElementById('open-button');
		parent.style.opacity = .9;
		setTimeout(function() {
			jump(3);
		}, 300);
		return;
	}

	ICON.src = "img/Icons/close icon.png";
	chat_open = true;
	removeNotification();

	HOLDER.style.height = "100%";
	HOLDER.style.left = "0px";
	PARENT.growChat();
}
function closeChat(){
	ICON.src = "img/Icons/chat icon.png";
	chat_open = false;

	HOLDER.style.height = "0px";
	HOLDER.style.left = "100%";
	setTimeout(function() {
		if(chat_open)return;
		PARENT.shrinkChat();
	}, 1000);
}

function toggleChat(){
	if(chat_open){
		closeChat();
	}
	else {
		openChat();
	}
}

document.getElementById('inputMessage').onkeypress = function(event){
	if(event.keyCode==13&&this.value!='')
	{
		PARENT.game.INTERFACE.Game.Send_Chat(this.value);
		this.value = "";
	}
};

var chatters = [];
var nameList = document.getElementById('connectInfo');
var chat = document.getElementById('chat');

function addPlayer(name, socket)
{
	var nameNode = document.createElement('div');
	nameNode.innerHTML = name;
	nameNode.setAttribute('class','namelist');
	nameList.appendChild(nameNode);
	chatters.push([name, socket, nameNode]);
}
function delPlayer(socket)
{
	for(var i in chatters)
	{
		if(chatters[i][1]==socket)
		{
			nameList.removeChild(chatters[i][2]);
			chatters.splice(i, 1);
			break;
		}
	}
}

function removeNotification()
{
	if(!notification)return;
	notification = false;
	let NOTIFY = document.getElementById('notify');
	NOTIFY.style.display = "none";
	NOTIFY.style.left = "-80%";
	NOTIFY.style.top = "-100%";
	NOTIFY.style.width = "75%";
}
function notify()
{
	if(notification || chat_open)return;
	notification = true;
	let NOTIFY = document.getElementById('notify');

	document.getElementById('open-button').style.opacity = 1;
	NOTIFY.style.display = "block";
	NOTIFY.style.left = "100%";
	NOTIFY.style.top = "100%";

	setTimeout(function() {
		if(!notification)return;
		NOTIFY.style.left = "-80%";
		NOTIFY.style.top = "-100%";
	}, 500);
	setTimeout(function() {
		if(!notification)return;
		NOTIFY.style.top = "-20px";
		NOTIFY.style.width = "200%";
	}, 1000);
	setTimeout(function() {
		document.getElementById('open-button').style.opacity = .45;
	}, 2000);
}
function add_msg(sender, text)
{
	notify();

	var name = null;
	for(var i in chatters)
	{
		if(chatters[i][1]==sender)
		{
			name = chatters[i][0];
			break;
		}
	}
	if(name==null)return;
	var msg_node = document.createElement('div'),
		txt_node = document.createElement('div'),
		name_node = document.createElement('div');
	name_node.innerHTML = name;
	txt_node.innerHTML = ': '+text;
	msg_node.setAttribute('class','messageContainer');
	name_node.setAttribute('class','username');
	txt_node.setAttribute('class','msgContent');
	msg_node.appendChild(name_node);
	msg_node.appendChild(txt_node);
	chat.appendChild(msg_node);
}
