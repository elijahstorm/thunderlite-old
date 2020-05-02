const CONTENTPAGE = 2; // Content -> Profile Page
function CONTENTGRAB() {
	return CONTENTPAGE;
}
let socket;
let online = false;
let PICSRC;
let IMAGEUPLOAD = false;

function Report_Data(profile) {
  document.getElementById('user_name').innerHTML = profile.username;
  document.getElementById('user_email').innerHTML = profile.email;
  document.getElementById('user_points').innerHTML = "Points: "+profile.points;
  document.getElementById('user_level').innerHTML = "Level: "+profile.level;
  document.getElementById('user_wins').innerHTML = "Wins: "+profile.gamesWon;
  document.getElementById('user_games_played').innerHTML = "Total games played: "+profile.totalGames;

  if(profile.pic==null)
  {
    profile.pic = "../includes/img/Icons/profile/pic"+(Math.floor(Math.random()*5))+".png";
  }

  let img = document.createElement('img');
  img.src = profile.pic;
  img.id = "main_profile_pic";
  img.style.width = "100%";
  img.style.height = "100%";
  document.getElementById('profile_pic').appendChild(img);
  PICSRC = img.src;

  let update = document.createElement('i');
  update.className = "fas fa-upload update-data";
  update.onclick = function() {
    document.getElementById("popup-container").className += " shown";
    document.getElementById("popup-container").style.left = "0px";
    document.getElementById("profile-pic-popup").style.display = "block";
    document.getElementById("upload-pic").src = PICSRC;
    document.getElementById("upload-pic").style.width = "300px";
    document.getElementById("upload-pic").style.height = "300px";
    IMAGEUPLOAD = false;

    document.getElementById('popup-pic-upload').addEventListener('change', function() {
      if (this.files && this.files[0]) {
        let new_img = document.getElementById('upload-pic');
        new_img.src = URL.createObjectURL(this.files[0]);
        new_img.onload = function() {
          IMAGEUPLOAD = true;
          document.getElementById('upload-pic').style.visibility = "visible";

          let canvas = document.createElement("canvas");
          canvas.width = 250;
          canvas.height = 250;
          let ctx = canvas.getContext("2d");
          ctx.drawImage(new_img, 0, 0, 250, 250);
          new_img.src = canvas.toDataURL("image/png");
        };
      }
    });
  };
  document.getElementById('profile_pic').appendChild(update);
}
function Report_Error(error) {
  if("email")
  {
    document.getElementById('error_email').innerHTML = "Sorry, that doesn't look like an email to us.";
    document.getElementById('error_email').style.display = "block";
    return;
  }
  if("verify email")
  {
    document.getElementById('error_email').innerHTML = "Could not verify your email. Please check and make sure it's correct. If the error persists, please contact us here.";
    document.getElementById('error_email').style.display = "block";
    return;
  }
}

function Upload_Pic() {
  if(!IMAGEUPLOAD)return;
  PICSRC = document.getElementById('upload-pic').src;
  if(PICSRC==null)
  {
    return false;
  }
  socket.emit('userdata update', {
    type:"pic",
    new_pic:PICSRC
  });
  document.getElementById('main_profile_pic').src = PICSRC;
  Close_Popup();
}

function Close_Popup() {
  document.getElementById("popup-container").className = "w3-container w3-padding-32 popup-bg";
  document.getElementById("email-popup").style.display = "none";
  document.getElementById("profile-pic-popup").style.display = "none";
  document.getElementById("popup-container").style.left = "-150%";
}

function update_pass() {
  let pass = document.getElementById('up-pass-input');
  let conf = document.getElementById('up-pass-confirm');

  if(pass.value!=conf.value)
  {
    document.getElementById('error-pass').className = "data-error";
    document.getElementById('error-pass').innerHTML = "Passwords don't match.";
    return;
  }
  if(!window.parent.validateSignup("pass", pass.value))
  {
    document.getElementById('error-pass').className = "data-error";
    document.getElementById('error-pass').innerHTML = "The passwords can't contain certain characters.";
    return;
  }

  socket.emit("userdata update", {type:"password", new_pass:pass.value});
  document.getElementById('error-pass').className = "data-good";
  document.getElementById('error-pass').innerHTML = "Password updated!";
}


window.onload = function() {
	if(window.parent)socket = window.parent.socket;
	if(socket)online = true;
  socket.emit('userdata get', 'profile');
};
