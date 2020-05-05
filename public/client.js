/// Code written and created by Elijah Storm
// Copywrite April 5, 2020
// for use only in ThunderLite Project


function validateSignup(user, pass){
	if(!user||!pass)return false;
	if(user==""||pass=="")return false;
	if(user.indexOf("/")!=-1 || pass.indexOf("/")!=-1)return false;
	if(user.indexOf("\\")!=-1 || pass.indexOf("\\")!=-1)return false;
	if(user.indexOf(" ")!=-1 || pass.indexOf(" ")!=-1)return false;
	if(user.indexOf(".")!=-1 || pass.indexOf(".")!=-1)return false;
	if(user.indexOf(":")!=-1 || pass.indexOf(":")!=-1)return false;
	if(user.indexOf(";")!=-1 || pass.indexOf(";")!=-1)return false;
	return true;
}
function reportLoggedIn(user, pass, report){
	if(!LOADED){
		report("The game has not loaded yet.");
		return;
	}
	if(CONNECTED){
		report("Already signed in... try refreshing");
		return;
	}
	if(!validateSignup(user, pass))return;
	CONNECT(user, pass, report);
}
function reportNewUser(user, pass, report){
	if(!LOADED)return;
	if(CONNECTED)return;
	if(!validateSignup(user, pass))return;
	if(new Date-LAST_CONNECT_MESSAGE<5000){
		if(report)report("Please wait 5 seconds before retrying...");
		return;
	}
	LAST_CONNECT_MESSAGE = new Date;
	socket.emit('new user', user, pass);
}
function logOut(){

}

var gameFrame, chatFrame;
var game;
var first_time_opening_lobby = true;
var title_box_alert = function(updated){
	var old = document.title;
	this.time = 1000;
	var kill = false;
	var self = this;
	var toggle = true;
	this.stop = function(){
		kill = true;
	};
	var refresh_fnc = function(){
		if(kill){
			document.title = old;
			return;
		}
		if(toggle)
		{
			document.title = updated;
			toggle = false;
		}
		else
		{
			document.title = old;
			toggle = true;
		}
		setTimeout(refresh_fnc, self.time);
	};
	refresh_fnc();
};
var CONNECTED = false;
var CONNECTION_TIMEOUT = 0;
var LOADED = false;
var lobby_open = false;
var socket;
if(typeof io!=='undefined'){socket = io();}
var onFinishedLoadingList = [];
function onFinishedLoading(fnc){
	if(onFinishedLoadingList==null)return;
	onFinishedLoadingList.push(fnc);
}
window.onload = function(){
	LOADED = true;
	gameFrame = document.getElementById('gameFrame');
	game = gameFrame.contentWindow;
	socket.on('public log', function(msg, color, time){
		if(game.LOG)game.LOG.popup(msg, color, time);
	});
	socket.on('set client data', function(index, name){
		socket.index = index;
		socket.username = name;
	});
	socket.on('user joined', function(username){
		// if(game.LOG)game.LOG.popup(username+" joined","#FF0");
		if(!lobby_open)return;
		lobby.contentWindow._activeUsers.add();
		lobby.contentWindow._lobbyAmt.add();
	});
	socket.on('user left', function(username){
		// if(game.LOG)game.LOG.popup(username+" left","#FF0");
		if(!lobby_open)return;
		lobby.contentWindow._activeUsers.sub();
	});

	socket.on('message', function(data){
	// timestamp(data.type);
		if(data.type==null)return;
			/** initiate connection and errors */
		if(data.type==0)
		{	// refresh connection
			CONNECTION_TIMEOUT = 0;
		}
		else if(data.type==1)
		{ /** unused */	}
		else if(data.type==2)
		{	// refresh connection info
			if(!lobby_open)return;
			lobby.contentWindow._openGames.value = data.g;
			lobby.contentWindow._openGames.update();
			lobby.contentWindow._lobbyAmt.value = data.l;
			lobby.contentWindow._lobbyAmt.update();
			lobby.contentWindow._activeUsers.value = data.a;
			lobby.contentWindow._activeUsers.update();
			lobby.contentWindow._gamesPlaying.value = data.p;
			lobby.contentWindow._gamesPlaying.update();
		}
		else if(data.type==3)
		{	// receive already opened games data
			if(!lobby_open)return;
			let i = 0;
			for(i in data.info)
			{
				try {
					lobby.contentWindow.add_game(data.info[i].name,data.info[i].map,data.info[i].game);
					lobby.contentWindow._openGames.add();
					// add player list
				} catch (e) {
					game.LOG.popup("Error loading some game");
				} finally {

				}
			}
			game.Canvas.Kill_Ticker(game.LOADER);
			if(game.currently_playing)return; // if already in game, don't change gamestate to the lobby

										// initially land user on open games list, but...
										// if there aren't a lot of open games to choose from -> land user on game host
			if(i<2)				// if less then two open games waiting,
			{							// then will defult to send player to land on game hosting page
				game.chooseContent("MULTIPLAYER", null, true);
			}
			else game.chooseContent("GAME LOBBY", null, true);

			if(first_time_opening_lobby)
			{
				game.changeContent(game.CONTENT_REDIRECT);
				first_time_opening_lobby = false;
			}
		}
		else if(data.type==4)
		{	// client disconnected
			CONNECTED = false;
			CONNECTION_TIMEOUT = 0;
		}
		else if(data.type==5)
		{	// report username taken
			var err_report = gameFrame.contentWindow;
			if(err_report==null)return;
			if(err_report.report==null)return;
			err_report.report("User name taken!");
		}
		else if(data.type==6)
		{	// report username does not exist
			var err_report = gameFrame.contentWindow;
			if(err_report==null)return;
			if(err_report.report==null)return;
			err_report.report("Username does not exist!");
		}
		else if(data.type==7)
		{	// report password is not correct
			var err_report = gameFrame.contentWindow;
			if(err_report==null)return;
			if(err_report.report==null)return;
			err_report.report("Password not correct!");
		}
		else if(data.type==8)
		{	// error connecting to server
			if(!game.LOG){
				if(game.report==null)return;
				game.report("General error when signing-up/logging-in");
			}else{
				window.location.reload();
			}
		}
		else if(data.type==9)
		{	// new user added correctly
			var loginFrame = gameFrame.contentWindow;
			if(loginFrame==null)return;
			if(loginFrame.login==null)return;
			LAST_CONNECT_MESSAGE = 0;
			loginFrame.login();
		}

			/** game messages */
		else if(data.type==10)
		{	// end turn
			game.INTERFACE.Game.Active_Player().End_Turn();
		}
		else if(data.type==11)
		{	// move unit
			game.INTERFACE.Game.Move(data.unit, data.x, data.y, data.path, null, true);
		}
		else if(data.type==12)
		{	// act building
			let result;
			if(data.dir==null)
			{	// if built from building
				result = game.INTERFACE.Game.Build(data.source, data.input, null,  true);
			}
			else
			{	// if built from warmachine
				result = game.INTERFACE.Game.Build_From_Unit(data.source, data.input, data.dir, true);
			}
			if(!result)
			{
				game.LOG.popup("Error with gamestate! It will automatically reload to the last saved gamestate :)");
			}
			game.INTERFACE.Draw();
		}
		else if(data.type==13)
		{	// receive chat message
			if(!game.currently_playing)return;
			chatFrame.add_msg(data.sender, data.txt);
		}
		else if(data.type==14)
		{	// request game data
			if(!game.INTERFACE.Game)return;
			game.INTERFACE.Game.Update_Server_With_Gamestate();
		}
		else if(data.type==15)
		{	// report invalid game data -> fix or break if unfixable
			if(!game.INTERFACE.Game)return;
			if(data.gamestate==null)
			{ // no gamestate to revert to
				game.INTERFACE.Game.End_Game();
				if(!game.LOG)return;
				game.LOG.popup("ERROR: Game data issue. Could not salvage game.", "#F00", 10000);
				game.LOG.popup("Game ended and no points were lost", "#F00", 10000);
				game.LOG.popup("Note for dev., add button to auto restart last game?", "#FFF", 20000);
				return;
			}
			setTimeout(function(){ // reset game after 5 seconds
				game.load_game(data);
			}, 5000);
			setTimeout(function() {
				let G = game.INTERFACE.Game;
				game.INTERFACE.setGame(null);
				G.Set_Interface(game.Fast_Fake_Interface);
				G.End_Game();
			}, 2500);
			if(!game.LOG)return;
			game.LOG.popup("Sorry, it looks like the code's been changed...");
			setTimeout(function() {
				game.LOG.popup("We're setting your game back a turn to get you both back on the same page.");
			}, 2500);
		}
		else if(data.type==16)
		{	// player reconnected
			gameFrame.onload = function(){
				if(!game.load_game)return;
				game.load_game(data);
				game.LOG.popup("You have been reconnected!");
			}
		}

			/** lobby connections */
		else if(data.type==20)
		{	// caching user info and validating connection
			socket.index = data.index;
			START_CONNECTION();
		}
		else if(data.type==20.5)
		{	// caching user profile pictures
			if(game.CONTENTGRAB()!=1)return;
			let g = game.INTERFACE.Game;
			let pics = JSON.parse(data.pics);

			for(let i in pics)
			{
				if(pics[i]==null)
					continue;
				g.Player(i).Icon = new game.Images.Source(pics[i]);
			}
		}
		else if(data.type==21)
		{	// setup game to play
			game.join_game(data);
		}
		else if(data.type==22)
		{	// starting game
			if(game.LOG)game.LOG.popup("game started","#F00");
			game.INTERFACE.Game.Start();
			lobby.contentWindow._openGames.sub();
		}
		else if(data.type==22.5)
		{	// report updated passkey for game to work
			game.INTERFACE.Game.Set_Passkey(data.passkey);
		}
		else if(data.type==23)
		{	// report opened game id
			socket.game_id = data.id;
		}
		else if(data.type==24)
		{	// player timed-out-of/left game
			if(game.currently_playing)
			{
				game.INTERFACE.Game.Leave(data.slot);
			}
			else game.Menu.PreGame.Set(data.slot, "");
		}
		else if(data.type==25)
		{	// game closed in lobby
			if(!lobby_open)return;
			lobby.contentWindow.remove_game(data.game);
			lobby.contentWindow._openGames.sub();
		}
		else if(data.type==26)
		{	// join game
			if(game.LOG)game.LOG.popup(data.name+" joined game","#F00");
			game.INTERFACE.Game.Set_Player(data.slot, data.player, data.name);
			game.Menu.PreGame.Set(data.slot, data.name);
		}
		else if(data.type==27)
		{	// open game in lobby
			if(!lobby_open)return;
			lobby.contentWindow.add_game(data.name,data.map,data.game);
			lobby.contentWindow._openGames.add();
			// if(game.LOG)game.LOG.popup(game.Levels.Names(data.map)+" opened with id "+data.game,"#F00");
		}
		else if(data.type==28)
		{	// player lost connection
			game.INTERFACE.Allow_Controls(false);
			game.INTERFACE.Display_Menu(game.Menu.No_Touch_Overlay);

			if(!game.LOG)return;
			var playerName = game.INTERFACE.Game.Player(data.slot);
			if(playerName)
				playerName = playerName.Name;
			else playerName = data.slot;
			game.LOG.popup("Warning: "+playerName+" lost connection");
			setTimeout(function() {
				if(game.INTERFACE.Open_Menu()==null)return;
				game.LOG.popup("This player has 30 seconds to reconnect");
			}, 3000);
			setTimeout(function() {
				if(game.INTERFACE.Open_Menu()==null)return;
				game.LOG.popup("Otherwise they forfeit the game");
			}, 6000);
			setTimeout(function() {
				if(game.INTERFACE.Open_Menu()==null)return;
				game.LOG.popup("10 more seconds...");
			}, 20000);
		}
		else if(data.type==29)
		{	// player regained connection
			game.INTERFACE.Allow_Controls(true);
			game.INTERFACE.Close_Menu();

			if(!game.LOG)return;
			var playerName = game.INTERFACE.Game.Player(data.slot);
			if(playerName)
				playerName = playerName.Name;
			else playerName = data.slot;
			game.LOG.popup(playerName+" reconnected!", "#FFF");
		}

			/** user profile information */
		else if(data.type==300)
		{	// report total unlocked story levels
			if(game.CONTENTGRAB()!=2)return;
			game.Report_Data(data.profile);
		}

			/** loading published games */
		else if(data.type==500)
		{	// error requesting data
			console.error("Could not get data request. CODE:",data.type,data.errType);
			if(data.errType==8)
			{
				if(game.CONTENTGRAB()!=2)return;
				game.Report_Error(data.error);
				return;
			}
		}
		else if(data.type==501)
		{	// map index does not exist
			game.LOG.popup("We could not find any of the maps that you were looking for. Try changing your search");
		}
		else if(data.type==502)
		{	// UNUSED
			game.LOG.popup("Unsed, Server Status 502");
		}
		else if(data.type==503)
		{	// recieved a list of game data that matched the query
			game.INTERFACE.Update_Map_Search(data.data);
		}
		else if(data.type==504)
		{	// report total unlocked story levels
			game.Levels.Report_Unlocked(data.story_prog);
		}

			/** client saved custom map data */
		else if(data.type==600)
		{	// Unlocked the next story level
			game.Levels.Report_Unlocked(data.story_prog);
			game.Menu.StoryScreen.Prep(data.section);
			game.Menu.StoryScreen.Load();
		}
		else if(data.type==601)
		{	// Unlocked all the story levels
		}
		else if(data.type==605)
		{	// CONGRATS for leveling up!

		}

			/** client saved custom map data */
		else if(data.type==700)
		{	// error requesting mapdata
			if(game.CONTENTGRAB()!=1)return;

			console.error("ERROR with server mapdata",data.type);
		}
		else if(data.type==701)
		{	// download existing maps
			if(game.CONTENTGRAB()!=1)return;

			game.Map_Editor.Server_Response.Map_List(data.data);
		}
		else if(data.type==702)
		{	// UNUSED
			if(game.CONTENTGRAB()!=1)return;
		}
		else if(data.type==703)
		{	// delete existing map
			if(game.CONTENTGRAB()!=1)return;
		}
		else if(data.type==704)
		{	// report map playtested
			if(game.CONTENTGRAB()!=1)return;
		}
		else if(data.type==705)
		{	// publish playtested map
			if(game.CONTENTGRAB()!=1)return;
		}
		else if(data.type==706)
		{	// report newly uploaded map's unique Identification\
			if(game.CONTENTGRAB()!=1)return;
			game.Map_Editor.Server_Response.Report_Id(data.mapid);
		}
		else if(data.type==707)
		{	// report faulty map upload -- try again?
			if(game.CONTENTGRAB()!=1)return;
		}
		else if(data.type==708)
		{	// user has too many maps saved, delete old map or update exsisting map
			if(game.CONTENTGRAB()!=1)return;
		}
		else if(data.type==709)
		{	// cannot find map with that ID on server... if you think this is an accident on our part, please report the incident to us
			if(game.CONTENTGRAB()!=1)return;
		}
		else if(data.type==710)
		{	// map succesfully updated / deleted / renammed
			if(game.CONTENTGRAB()!=1)return;

			game.Map_Editor.Server_Response.Updated_With_Server(true);
		}
		else if(data.type==777)
		{	// unlucky general error -- don't know what caused error here
			if(game.CONTENTGRAB()!=1)return;
		}

			/** in-game error messages */
		else if(data.type==100)
		{	// could not connect to game message
			if(game.LOG)game.LOG.popup("ERROR: Could not connect to game "+data.game, "#F00");
		}

			/** logs */
		else if(data.type==110)
		{	// console log message
			console.warn("WARNING: IMPROPER USE OF MESSAGING");
			console.log(data.msg);
		}
		else if(data.type==111)
		{	// game log message
			console.warn("WARNING: IMPROPER USE OF MESSAGING");
			if(game.LOG)game.LOG.popup(data.msg, data.color);
		}
	});
	for(var i in onFinishedLoadingList){
		onFinishedLoadingList[i]();
	}
	onFinishedLoadingList = null;
};

var LAST_CONNECT_MESSAGE = 0;
function CONNECT(name, pass, report){
	if(CONNECTED)return;
	if(new Date-LAST_CONNECT_MESSAGE<5000){
		if(report)report("Please wait 5 seconds before retrying...");
		return;
	}
	LAST_CONNECT_MESSAGE = new Date;
	socket.username = name;
	socket.password = pass;
	socket.emit('connect user', name, pass);
}

const CONNECTION = function(){
	let CONNECTION = {
		FAST:3000,
		SLOW:20000,
		NONE:-1
	};
	let time = CONNECTION.SLOW;
	this.GET = function(){
		return time;
	};
	this.SET = function(val){
		switch (val) {
			case 0:
				time = CONNECTION.NONE;
				break;
			case 1:
				if(time==CONNECTION.NONE)
				{
					time = CONNECTION.SLOW;
					CHECK_CONNECTION();
					return;
				}
				time = CONNECTION.SLOW;
				break;
			case 1:
				if(time==CONNECTION.NONE)
				{
					time = CONNECTION.FAST;
					CHECK_CONNECTION();
					return;
				}
				time = CONNECTION.FAST;
				break;
		}
	};
};
const CONNECTION_ACTIVE = new CONNECTION;

function setConnection(val){
	CONNECTION_ACTIVE.SET(val);
}

function START_CONNECTION(){
	CONNECTED = true;
	CHECK_CONNECTION();
	if(gameFrame.src!="game.html")
		gameFrame.src = "includes/game.html";
	document.title = socket.username+" playing ThunderLite";
}
function CHECK_CONNECTION(){
	if(CONNECTION_TIMEOUT>5)
	{
		if(CONNECTED)
		{
			LOST_CONNECTION();
			CONNECTED = false;
		}
	}
	else
	{
		if(!CONNECTED)
		{
			CONNECT(socket.username, socket.password);
			RECONNECTED();
		}
		CONNECTION_TIMEOUT++;
	}
	socket.emit('check');
	if(CONNECTION_ACTIVE.GET()==-1)return;
	setTimeout(function(){CHECK_CONNECTION()}, CONNECTION_ACTIVE.GET());
}
function LOST_CONNECTION(){
	var time = new Date().toLocaleTimeString();
	console.error("Lost connection at "+time);
	if(game.LOG)game.LOG.popup("Lost connection at "+time,"#F00",10000);
	document.title_alert = new title_box_alert("LOST CONNECTION");
}
function RECONNECTED(){
	var time = new Date().toLocaleTimeString();
	console.error("Regained connection at "+time);
	if(game.LOG)game.LOG.popup("Regained connection at "+time,"#0F0",5000);
	refresh_lobby();
	if(document.title_alert)
	{
		document.title_alert.stop();
	}
}

function openLobby(){
	if(lobby==null)
	{
		lobby = game.document.getElementById("lobbyFrame");
		if(lobby==null)return;
	}
	lobby.src = "lobby.html";
	socket.emit('lobby on');
	game.document.getElementById("refreshLobby").href = "lobby.html";
}
function closeLobby() {
	socket.emit('lobby off');
	lobby.src = "holder.html";
	lobby = null;
}
function openChat(){
	document.getElementById('chat-container').style.display = "block";
	chatFrame = document.getElementById('chatFrame').contentWindow;
	chatFrame.openChat();
	refreshChatList();
}
function refreshChat(){
	document.getElementById('chatFrame').src = "includes/chat.html";
}
function closeChat(){
	document.getElementById('chat-container').style.display = "none";
}
function growChat(){
	document.getElementById('chat-container').className = "growchat";
}
function shrinkChat(){
	document.getElementById('chat-container').className = "";
}

function refreshChatList(){
	if(game.INTERFACE.Game==null)return;
	var list = game.INTERFACE.Request_Connections();
	for(var i in list){
		chatFrame.addPlayer(list[i][0], list[i][1]);
	}
}
function refresh_lobby(){
	if(!lobby_open)return;
	lobby.contentWindow.games = [];
	lobby.contentWindow.refresh();
	socket.emit('refresh lobby');
}
function refresh_game(){
	gameFrame.src = gameFrame.src;
}

function send_chat(__input_passkey, text){
	if(!game.currently_playing)return;
	socket.emit('chat', __input_passkey, text);
	chatFrame.add_msg(socket.index, text);
}
function join_game(game_id){
	if(game.currently_playing)
	{
		if(!confirm("Are you sure you want to leave this game?"))
			return;
		game.INTERFACE.Game.End_Game(false);
	}
	socket.emit('join', game_id);
	game.changeContent();
}

function timestamp(){
	var str = "";
	for(var i in arguments)
	{
		str+=arguments[i]+" ";
	}
	console.log(new Date().toLocaleTimeString(),"->",str);
}
let lobby = null;
