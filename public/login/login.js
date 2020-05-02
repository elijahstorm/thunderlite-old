var signupShown = false,
	passwordShown = false;
var title = document.getElementById('title');
var sendBtn = document.getElementById('sendBtn');
var data = document.getElementById('data_contents');
var user = document.getElementById('username');
var pass = document.getElementById('pass');
var btn = document.getElementById('signupBtn');
var error = document.getElementById('error');
let stayCheck = false;
let container = window.parent.document.getElementById("container");
let logoStyle = document.getElementById('loginLogo');

document.getElementById('loginLogo').src = "Login "+(window.parent.mobilecheck() ? "Mobile" : "Desktop")+".png";

var report = function(err){
	error.style.visibility = 'visible';
	error.innerHTML = err;
}

function eraseCookie(){
	document.cookie = "user;SameSite=Strict;expires=-1";
	document.cookie = "pass;SameSite=Strict;expires=-1";
}

window.onload = function(){
	if(window.innerWidth<400)
	{
		btn.style.marginTop = "45px";
	}
};

window.parent.onFinishedLoading(function(){
	let LOGIN = function(e){
		if(e.keyCode==13)
		{
			login();
			return false;
		}
	};
	pass.onkeydown = LOGIN;
	user.onkeydown = LOGIN;

	let reflow = function(e){
		let valueCheck = 270;
		if(window.parent.mobilecheck())
		{
			valueCheck = 220;
		}
	};
	window.addEventListener("resize", reflow, false);
	reflow();

	if(document.cookie!=null)
	if(document.cookie!=""){
		var cookies = document.cookie.split("; ");
		var cookUser,cookPass;
		for(var i in cookies){
			if(cookUser&&cookPass)break;
			var curCookie = cookies[i];
			if(curCookie.substr(0,4)=="user"){
				var equals = curCookie.indexOf('=');
				if(~equals){
					cookUser = curCookie.substr(equals+1);
				}
				continue;
			}
			if(curCookie.substr(0,4)=="pass"){
				var equals = curCookie.indexOf('=');
				if(~equals){
					cookPass = curCookie.substr(equals+1);
				}
				continue;
			}
		}
		if(cookUser&&cookPass){
			user.value = cookUser;
			pass.value = cookPass;
			// login();
		}
		pass.focus();
	}
	else user.focus();
});

function openSignup(){
	if(signupShown){
		// title.innerHTML = 'Logging in...';
		sendBtn.innerHTML = 'LOGIN';
		signupShown = false;
		btn.innerHTML = "CREATE ACCOUNT";
	}else{
		// title.innerHTML = 'Signning up...';
		sendBtn.innerHTML = 'CREATE ACCOUNT';
		signupShown = true;
		btn.innerHTML = 'LOGIN';
	}
}

function seePassword() {
	if(passwordShown){
		pass.type = "password";
		passwordShown = false;
	}else{
		pass.type = "text";
		passwordShown = true;
	}
}

const stayBox = document.getElementById("staySignedOn");
function toggleMemory() {
	if (stayCheck) {
		stayCheck = false;
		stayBox.className = "checkmarkbox";
	}
	else {
		stayCheck = true;
		stayBox.className += " checked";
	}
}

function sendMsgBtn(){
	if(stayCheck){
		var date = new Date();
		date.setTime(date.getTime()+4838400000);
		var expires = date.toGMTString();
		document.cookie = "user="+user.value+";SameSite=Strict;expires="+expires+";path=/";
		document.cookie = "pass="+pass.value+";SameSite=Strict;expires="+expires+";path=/";
	}
	if(signupShown)
		signup();
	else login();
}

function login(){
	if(!window.parent.validateSignup(user.value, pass.value)){
		report("invalid user info");
	}
	else window.parent.reportLoggedIn(user.value, pass.value, report);
}

function signup(){
	if(!window.parent.validateSignup(user.value, pass.value)){
		report("invalid user info");
	}
	else window.parent.reportNewUser(user.value, pass.value, report);
}
