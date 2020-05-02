var express = require('express');
var bcrypt = require('bcrypt');

const cryptPassword = function(password, callback) {
	bcrypt.genSalt(10, function(err, salt) {
		if (err)
			return callback(err);

		bcrypt.hash(password, salt, function(err, hash) {
			return callback(err, hash);
		});
	});
};
const comparePassword = function(plainPass, hashword, callback) {
	bcrypt.compare(plainPass, hashword, function(err, isPasswordMatch) {
		return err == null ?
			callback(null, isPasswordMatch) :
			callback(err);
	});
};

var nodemailer = require('nodemailer');
const Service_Transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'thunderlitedev@gmail.com',
    pass: 'LoudCr0ws5'
  }
});

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
var mongo = require('mongojs')
var db = mongo(process.env.MONGODB_URI || 'mongodb://localhost/datatest');

db.on('error', function(err){
	console.log('Data Base ERR:', err);
});
server.listen(port, function(){
	console.log('\********** Server listening on port %d **********', port);
});

function SEND_EMAIL(type, data) {
	let mailOptions;
	if(type=="verify email")
	{
		// SEND EMAIL
		// data.email
		// data.code

		mailOptions = {
		  from: 'thunderlitedev@gmail.com',
		  to: data.email,
		  subject: 'ThunderLite email verification',
		  text: "Your code to update your email is: "+data.code+". If this was not you, please ignore this message. Nothing will change unless you take action."
		};
	}
	else if(type=="email")
	{
		// alert user of email change.

		mailOptions = {
		  from: 'thunderlitedev@gmail.com',
		  to: data.email,
		  subject: 'ThunderLite email updated',
		  text: 'Thank you for updating your email, '+data.name+'. Contact will continue to come to this email.'
		};
	}
	else if(type=="password")
	{
		// alert user of password change.

		mailOptions = {
		  from: 'thunderlitedev@gmail.com',
		  to: data.email,
		  subject: 'ThunderLite password updated',
		  text: 'If this was not you, please contact us.'
		};
	}
	else if(mailOptions==null)
		return;
	Service_Transport.sendMail(mailOptions, function(error, info){
	  if (error) {
	    timestamp("EMAIL ERROR", error);
	  } else {
	    timestamp('Email sent: ' + info.response);
	  }
	});
}
function DATA_CHECK(type, data) {
	if(type=="email")
	{
		if(typeof(data)!=="string")
			return false;
		if(data.indexOf('@')==-1)
			return false;
		return true;
	}
	if(type=="SET verify email")
	{

		return true;
	}
	if(type=="verify email")
	{

		return true;
	}
	if(type=="password")
	{
		if(typeof(data)!=="string")
			return false;
		if(data=="")return false;
		if(data.indexOf("/")!=-1)return false;
		if(data.indexOf("\\")!=-1)return false;
		if(data.indexOf(" ")!=-1)return false;
		if(data.indexOf(".")!=-1)return false;
		if(data.indexOf(":")!=-1)return false;
		if(data.indexOf(";")!=-1)return false;
		return true;
	}
	if(type=="pic")
	{
		if(typeof(data)!=="string")
			return false;
		if(data=="")return false;
		return true;
	}
	return false;
}

// Routing
app.use(express.static(__dirname + '/public'));

function timestamp(){
	var str = "";
	for(var i in arguments)
	{
		str+=arguments[i]+" ";
	}
	console.log(new Date().toLocaleTimeString(),"->",str);
}
var data_list = function()
{
	function make_letter()
	{ // 65 = A, 97 = a
		let start = Math.random()>0.5 ? 65 : 97;
		let index = Math.floor(Math.random()*26)+start;
		if(start==65)	// upper case
		{	// these if/else's prevent lookalike characters from existing, to make course input freindlier
			while(index==14 || index==8)	// O, I
			{
				index = Math.floor(Math.random()*26)+start;
			}
		}
		else
		{	// lower case
			while(index==11)	// l
			{
				index = Math.floor(Math.random()*26)+start;
			}
		}
		return String.fromCharCode(index);
	}
	function make_number()
	{	// 1 to 9
		let index = Math.random()*9+1;
		return Math.floor(index);
	}
	function make_unique_index()
	{
		let _str = "";
		for(let bunch=0;bunch<9;bunch++)
		{
			_str += Math.random()>0.3 ? make_letter() : make_number();
		}
		return _str;
	}

	this.list = [];
	this.Add = function(data)
	{
		let _index, found = true;
		while(found)
		{
			_index = make_unique_index();
			found = false;
			for(let i in this.list)
			{
				if(i==_index)
				{
					found = true;
					break;
				}
			}
		}
		this.list[_index] = data;
		return _index;
	};
	this.Remove = function(index)
	{
		for(let i in this.list)
		{
			if(i==index)
			{
				let data = this.list[i];
				this.list[i] = null;
				this.list = this.list.filter(function(el) {
					return el!=null;
				});
				return data;
			}
		}
		return null;
	};
	this.Active = function()
	{
		var running = [];
		for(var i in this.list)
		{
			if(this.list[i]!=null)
			{
				running.push(this.list[i]);
			}
		}
		return running;
	};
};
var con_handler = function(){
	var active = new data_list();
	var amt = 0;
	this.Socket = function(index)
	{
		return active.list[index];
	};
	this.Add = function(socket)
	{
		amt++;
		return active.Add(socket);
	};
	this.Disconnect = function(index)
	{
		var user = active.Remove(index);
		if(user==null)return;
		amt--;
		timestamp("user "+user.username+" disconnected");
	};
	this.Reconnect = function(index, socket)
	{
		var oldSocket = active.list[index];
		if(oldSocket==null)return;
		socket.index = oldSocket.index;
		socket.username = oldSocket.username;
		socket.vars = oldSocket.vars;
		active.list[index] = socket;
		timestamp("user",oldSocket.username,"reconnected");
	};
	this.Length = function()
	{
		return active.list.length;
	};
	this.Amount = function()
	{
		return amt;
	};
	this.Active = function()
	{
		return active.Active();
	};
};
var Connections = new con_handler();

let SUDO_ROUTE_PASS = Math.random();
setInterval(function(){
	SUDO_ROUTE_PASS = Math.random();
}, 300000); // refresh passkey every 5 minutes

var Game = function(map, name, slots){
	let __passkey = null;
	function passkey_check(input_key)
	{
		if(__passkey==null)
			return true; // no passkey needed yet--game hasn't started
		if(__passkey==input_key)
			return true;
		if(input_key==SUDO_ROUTE_PASS)
			return true;
		timestamp("Invalid passkey attempt in Game",self.index_in_server,"-> bad key:",input_key);
		return false;
	}
	this.Passkey = function()
	{
			__passkey = Math.random();
			return __passkey;
	};
	var playerData = [];
	var self = this;

	for(var i=0;i<slots;i++)
	{
		playerData[i] = [null,null,false];
		// 0 socket index
		// 1 most recent game data
		// 2 received game data for most recent check
	}
	self.Set = function(index, value){
		if(index>=playerData.length)return;
		playerData[index][0] = value;
	};
	self.Data = function(index){
		var arr = [];
		for(var i in playerData)
		{
			arr[i] = playerData[i][0];
		}
		return arr;
	};
	self.Length = function(){
		return playerData.length;
	};
	self.Name = function(){
		return name;
	};
	self.Map = function(){
		return map;
	};
	self.index_in_server = -1;
	self.lobby = -1;
	self.started = false;

	var lastValidGameState = null;
	var goodCallbackFnc = function(){};
	var badCallbackFnc = function(){};
	function recievedGameData(playerIndex){
		playerData[playerIndex][2] = true;
		for(var i in playerData){
			if(!playerData[i][2])
			if(playerData[i][0]!=null){
				return; // someone has not sent in game data yet
			}
		} // if loop ends without returning, then all data has been recieved, now ready for check

		for(var i=0,last_i=null;i<playerData.length;i++){
			if(playerData[i][0]==null)continue;
			if(last_i!=null)
			if(playerData[i][1]!=playerData[last_i][1]){
					// games report differing data
				badCallbackFnc();
				return;
			}
			last_i = i;
		} // if loop ends, all is okay
		lastValidGameState = playerData[0][1];
		goodCallbackFnc();
	};
	self.Check_Data = function(input_passkey, goodCallback, badCallback, requestIndex, requestData){
		if(!passkey_check(input_passkey))return;
		self.Send(input_passkey, {type:14}, requestIndex); // request everyone else send data
		for(var i in playerData){
			// clear last check
			playerData[i][2] = false;
		}
		if(typeof goodCallback==='function')
			goodCallbackFnc = goodCallback;
		else goodCallbackFnc = function(){};
		if(typeof badCallback==='function')
			badCallbackFnc = badCallback;
		else badCallbackFnc = function(){};
		self.Update_Data(input_passkey, requestIndex, requestData);
	};
	self.Update_Data = function(input_passkey, socketIndex, gameData){
		if(!passkey_check(input_passkey))return;
		var playerIndex = null;
		for(var i in playerData){
			if(playerData[i][0]==socketIndex){
				playerIndex = i;
				break;
			}
		}
		if(playerIndex==null)return;
		playerData[playerIndex][1] = gameData;
		recievedGameData(playerIndex);
	};
	self.Revert = function(input_passkey){
		if(!passkey_check(input_passkey))return;

		var game = self;
		var connections = game.Data();
		var names = [];
		for(var i in connections)
		{
			if(connections[i]==null)
			{
				names.push("");
			}
			else names.push(Connections.Socket(connections[i]).username);
		}
		 // send reconnected player last gamestate
		self.Send(input_passkey, {
			type:15,
			gamestate:lastValidGameState,
			game:game.index_in_server,
			passkey:__passkey,
			players:{
				c:connections,
				n:names
			}
		});
	};

	self.Leave = function(input_passkey, socketIndex, rejoinTime, outOfTimeFnc){
		if(!passkey_check(input_passkey))return;
		var empty = true;
		var playerIndex;
		for(var i in playerData)
		{
			if(playerData[i][0]==socketIndex)
			{
				playerIndex = i;
				continue;
			}
			if(playerData[i][0]!=null)
			{
				empty = false;
			}
		}
		if(empty)
		{
			Game_List.Close(self.index_in_server);
			if(typeof outOfTimeFnc==='function')outOfTimeFnc();
		}
		else if(playerIndex!=null)
		{
			playerData[playerIndex][0] = null;
			if(!self.started){	// if game hasn't started, just remove immediately
				self.Send(input_passkey, {type:24,slot:playerIndex});
				if(typeof outOfTimeFnc==='function')outOfTimeFnc();
				return;
			}
			if(rejoinTime){ // give player chance to reconnect
				self.Send(input_passkey, {type:28,slot:playerIndex}); // warn that player lost connection
				var disconPlayer = Connections.Socket(socketIndex); // disconnected player
				if(disconPlayer!=null)
					timestamp("user",disconPlayer.username,"lost connection mid game");
				setTimeout(function(){
					if(playerData[playerIndex][0]!=null)return;
					self.Send(input_passkey, {type:24,slot:playerIndex}); // report player failed to reconnect
					if(typeof outOfTimeFnc==='function')outOfTimeFnc();
				}, rejoinTime);
			}else{ // player cannot try to reconnect, auto termination
				self.Send(input_passkey, {type:24,slot:playerIndex});
				if(typeof outOfTimeFnc==='function')outOfTimeFnc();
			}
		}
	};
	self.Rejoin = function(input_passkey, playerIndex, socketIndex){
		if(!passkey_check(input_passkey))return;
		if(!playerData[playerIndex])return;
		if(playerData[playerIndex][0]!=null)return;
		var returningPlayer = Connections.Socket(socketIndex);
		if(returningPlayer==null)return;
		playerData[playerIndex][0] = socketIndex;
		self.Send(input_passkey, {type:29,slot:playerIndex}, socketIndex); // report player reconnected
		var gamestate = lastValidGameState;
		if(gamestate==null){ // this is the case if the game hasn't started
			gamestate = self.Map(); // so send new game data
		}

		var game = self;
		var connections = game.Data();
		var names = [];
		for(var i in connections)
		{
			if(connections[i]==null)
			{
				names.push("");
			}
			else names.push(Connections.Socket(connections[i]).username);
		}
		 // send reconnected player last gamestate
		returningPlayer.send({
			type:16,
			gamestate:gamestate,
			game:game.index_in_server,
			passkey:__passkey,
			players:{
				c:connections,
				n:names
			}
		});
	};
	self.Send = function(input_passkey, msg){
		if(!passkey_check(input_passkey))return;
		if(!msg)return;
		// extra arguments means socket indexes excluded from message
		for(var i in playerData)
		{
			var curPlayer = Connections.Socket(playerData[i][0]);
			if(curPlayer==null)continue; // player has disconnected
			if(arguments.length!=1)
			{
				var con = false;
				for(var j=1;j<arguments.length;j++)
				{
					if(curPlayer.index==arguments[j])
					{
						con = true;
						break;
					}
				}
				if(con)continue;
			}
			curPlayer.send(msg);
		}
	};
};
var gl_handler = function(){
	var games = new data_list();
	var amt = 0;
	this.Length = function()
	{
		return games.list.length;
	};
	this.Amount = function()
	{
		return amt;
	};
	this.Add = function(game, host, input_passkey)
	{
		game.Set(0, host, input_passkey);
		amt++;
		var gameId = games.Add(game);
		game.index_in_server = gameId;
		timestamp("Game",gameId,"->",game.Name(),"opened");
		return gameId;
	};
	this.Active = function()
	{
		return games.Active();
	};
	this.Game = function(index)
	{
		if(index==null)return null;
		return games.list[index];
	};
	this.Close = function(index)
	{
		var cur = games.Remove(index);
		if(cur==null)return;
		amt--;

		timestamp("Game",cur.index_in_server,"->",cur.Name(),"closed");
	};
};
let Game_List = new gl_handler();
let Lobby = new data_list();

function send_lobby_info(data, sender){
	var active = Connections.Active();
	for(var i in active)
	{
		if(active[i].vars.lobby_listening)
		{
			if(active[i].index==sender)continue;
			active[i].send(data);
		}
	}
}

io.on('connection', function(socket){
	socket.vars = {
		online:false,
		in_game:null,
		lobby_listening:true
	};

	socket.on('lobby on', function(){
		socket.vars.lobby_listening = true;
	});
	socket.on('lobby off', function(){
		socket.vars.lobby_listening = false;
	});
	socket.on('refresh lobby', function(){
		if(!socket.vars.lobby_listening)return;
		var data = [];
		var open_games = Lobby.Active();
		for(var i in open_games)
		{
			var game = Game_List.Game(open_games[i]);
			if(game==null)continue;
			data[i] = {
				game:game.index_in_server,
				map:game.Map(),
				name:game.Name()
			};
		}
		socket.send({
			type:3,
			info:data
		});
		// also send connection info
		var lbyAmt = 0;
		var active_users = Connections.Active();
		for(var i in active_users)
		{
			if(Connections.Socket(i))
			if(Connections.Socket(i).vars.lobby_listening)
				lbyAmt++;
		}
		socket.send({
			type:2,
			g:open_games.length,
			l:lbyAmt,
			a:Connections.Amount(),
			p:Game_List.Amount()-open_games.length
		});
	});

	socket.on('save game', function(__input_passkey, data){
		var game = Game_List.Game(socket.vars.in_game);
		if(game==null)return;
		socket.vars.game_data = data;
		game.Update_Data(__input_passkey, socket.index, data);
	});
	socket.on('send move', function(__input_passkey, unit, x, y, path){
		var game = Game_List.Game(socket.vars.in_game);
		if(game==null)return;
		game.Send(__input_passkey, {
			type:11,
			unit:unit,
			x:x,y:y,
			path:path
		}, socket.index);
	});
	socket.on('send build', function(__input_passkey, source, input, direction){
		var game = Game_List.Game(socket.vars.in_game);
		if(game==null)return;
		game.Send(__input_passkey, {
			type:12,
			source:source,
			input:input,
			dir:direction
		}, socket.index);
	});
	socket.on('next player', function(__input_passkey, gameData){
		var game = Game_List.Game(socket.vars.in_game);
		if(game==null)return;
		game.Check_Data(__input_passkey, function(){ // check game data
			// game data good, continue game.
			game.Send(__input_passkey, {type:10}, socket.index);
		}, function(){
			timestamp("ERROR: game",game.index_in_server,game.Name(),"invalid, reverting to last saved point.");
			game.Revert(__input_passkey);
		}, socket.index, gameData);
	});

	socket.on('open', function(map, name, slots){
		var game = new Game(map, name, slots);
		var game_id = Game_List.Add(game, socket.index);
		socket.vars.slotIndex = 0;
		socket.vars.in_game = game_id;
		game.lobby = Lobby.Add(game_id);
		send_lobby_info({
			type:27,
			game:game_id,
			map:map,
			name:name
		}, socket.index);
		socket.send({
			type:23,
			index_in_server:game_id
		});
	});
	socket.on('join', function(game_id){
		// search node
		var game = Game_List.Game(game_id);
		var connections = game.Data();
		var names = [];
		for(let i in connections)
		{
			if(connections[i]==null)
			{
				names.push("");
			}
			else names.push(Connections.Socket(connections[i]).username);
		}
		for(let i in connections)
		{
			if(connections[i]!=null)
				continue;
			if(socket.vars.in_game!=null)
			{
				Game_List.Game(socket.vars.in_game).Leave(SUDO_ROUTE_PASS, socket.index);
			}
			socket.vars.in_game = game_id;
			game.Set(i, socket.index);
			socket.vars.slotIndex = i;
			connections[i] = socket.index;
			names[i] = socket.username;
			db.gamedata.find({Map_Id:game.Map(), PUBLISHED:true}, function(err, data){
				if(err){
					socket.send({
						type:100,
						game:game_id
					});
					return;
				}
				if(data.length==0){
					socket.send({
						type:100,
						game:game_id
					});
					return;
				}
				socket.send({
					type:21,
					map:data[0].mapdata,
					game:game.index_in_server,
					players:{
						c:connections,
						n:names
					}
				});
			});
			game.Send(-1, {
				type:26,
				player:socket.index,
				name:socket.username,
				slot:i
			}, socket.index);
			socket.broadcast.emit('joined game', socket.index, socket.username, game_id, i);
			timestamp(socket.username+" joined game "+game_id);
			return;
		}
		socket.send({
			type:100,
			game:game_id
		});
	});
	socket.on('leave', function(__input_passkey){
		var game = Game_List.Game(socket.vars.in_game);
		if(game==null)return;
		game.Leave(__input_passkey, socket.index);
		socket.vars.in_game = null;
		socket.vars.lobby_listening = true;
		timestamp(socket.username,"left game",game.Name());
	});
	socket.on('close', function(){
		var game = Game_List.Game(socket.vars.in_game);
		if(game==null)return;
		timestamp("game "+socket.vars.in_game+" closed");
		send_lobby_info({
			type:25,
			game:socket.vars.in_game
		});
		var players = game.Data();
		for(var i in players)
		{
			if(players[i]==null)continue;
			// Connections.Socket(players[i]).vars.lobby_listening = true;
		}
		if(game.lobby==-1)
		{
			Lobby.Remove(game.lobby);
			game.lobby = -1;
		}
		Game_List.Close(socket.vars.in_game);
	});
	socket.on('start', function(){
		var game = Game_List.Game(socket.vars.in_game);
		if(game==null)return;
		let __new_passkey = game.Passkey();
		game.Send(__new_passkey, {
			type:22
		}, socket.index); // exclude host from message
		game.Send(__new_passkey, {
			type:22.5,
			passkey:__new_passkey
		});
		var players = game.Data();
		let Pics = new Array(players.length);
		for(let i in players)
		{
			if(players[i]==null)continue;
			let _SOCKET = Connections.Socket(players[i]);
			_SOCKET.vars.lobby_listening = false;
			db.users.findOne({username:_SOCKET.username}, function(err, data){
				if(err)return;
				if(data==null)return;
				Pics[i] = data.pic;
				for(let check_all in Pics)
				{	// check to see if every pics has been downloaded
					if(Pics[check_all]==null)
					{	// if no picture data has been recieved yet
						if(players[check_all]==null)
							continue;	// if this player isn't a user, then ignore
						return;	// close and don't let final Pics send to everyone
					}
				}
					// once all pics are primed, then send the data to all the users in the game
				game.Send(__new_passkey, {
					type:20.5,
					pics:JSON.stringify(Pics)
				});
			});
		}
		game.started = true;
		timestamp("Game",game.index_in_server,"->",game.Name(),"started");
		send_lobby_info({
			type:25,
			game:socket.vars.in_game
		}, socket.index);
		Lobby.Remove(game.lobby);
		game.lobby = -1;
	});
	socket.on('chat', function(__input_passkey, msg){
		if(socket.vars.in_game==null)return;
		Game_List.Game(socket.vars.in_game).Send(__input_passkey, {
			type:13,
			sender:socket.index, // send index instead and interpret client side
			txt:msg
		}, socket.index);
	});

	socket.on('log', function(msg){
		timestamp(socket.username+": "+msg);


			db.users.find({}, function(err, data){
				if(err){
					socket.send({type:500,errType:5});
					return;
				}

				for(let i in data)
				{
					// encrypt passwords
					cryptPassword(data[i].password, function functionName(err, hashPass) {
						if(err!=null)
						{
							socket.send({type:500,errType:8,error:"encryption"});
							return;
						}
							// update stored password
						db.users.update({username:data[i].username}, {$set:{
							password:hashPass
						}});
					});
				}
			});
	});

	function Make_Unique_Map_Index(onFinish){
		function make_letter(){ // 65 = A, 97 = a
			let start = Math.random()>0.5 ? 65 : 97;
			let index = Math.floor(Math.random()*26)+start;
			if(start==65)
			{	// these if/else's prevent lookalike characters from existing, to make course input freindlier
				while(index==14 || index==8)	// O, I
				{
					index = Math.floor(Math.random()*26)+start;
				}
			}
			else
			{
				while(index==11)	// l
				{
					index = Math.floor(Math.random()*26)+start;
				}
			}
			return index;
		}
		function make_number(){	// 1 to 9
			let index = Math.random()*9+1;
			return Math.floor(index);
		}
		db.gamedata.find({}, function(err, existing_maps){
			let unique_str_id, remake = true;
			while(remake)
			{
				unique_str_id = "";
				for(let bunch=0;bunch<3;bunch++)
				{
					for(let index=0;index<3;index++)
					{
						unique_str_id+=String.fromCharCode(Math.random()>0.3 ? make_letter() : make_number());
					}
				}
				remake = false;
				for(let cur in existing_maps)
				{	// check to see if index is actually unique, if it's not then remake it until it is
					if(existing_maps[cur].Map_Id==unique_str_id)
					{
						remake = true;
						break;
					}
				}
			}
			onFinish(unique_str_id);
		});
	}
	socket.on('mapdata download', function(userpass){

		db.users.find({username:userpass.name}, function(err, data){
			if(err || data.length==0){
				socket.send({type:700});
				return;
			}
			if(data[0].password!=userpass.pass)
			{	// invalid username and password -- possible potential hijacking attempt
				socket.send({type:700});
				timestamp("Possible potential hijacking attempt targeted at user:", userpass.name);
				return;
			}
		});
		db.gamedata.find({mapowner:userpass.name}, function(err, data){
			if(err){
				socket.send({type:700});
				return;
			}
			let report_data = new Array();

			for(let i=0;i<data.length;i++)
			{
				report_data.push({
					saveindex:data[i].saveindex,
					map:data[i].mapdata,
					uploaded:data[i].PUBLISHED,
					map_id:data[i].Map_Id
				});
			}

			socket.send({type:701, data:report_data});
		});
	});
	socket.on('mapdata upload', function(userpass, input_data){
		db.users.find({username:userpass.name}, function(err, data){
			if(err || data.length==0){
				socket.send({type:700});
				return;
			}
			if(data[0].password!=userpass.pass)
			{	// invalid username and password -- possible potential hijacking attempt
				socket.send({type:700});
				timestamp("Possible potential hijacking attempt targeted at user:", userpass.name);
				return;
			}
		});
		Make_Unique_Map_Index(function(__index){
			db.gamedata.find({mapowner:userpass.name}, function(err, data){
				if(err){
					socket.send({type:777});
					return;
				}
				if(data.length<9){
					for(let i=0;i<data.length;i++)
					{
						if(data[i].saveindex==input_data.index)
						{
							socket.send({type:777});
							return;
						}
					}
					db.gamedata.save({
						mapowner:userpass.name,
						saveindex:input_data.index,
						mapdata:input_data.map,
						mapname:input_data.name,
						playtested:false,
						last_playtested:null,
						upload_date:new Date(),
						PUBLISHED:false,
						publish_date:null,
						Map_Id:__index
					}, function(err, saved){
						if(err||!saved)socket.send({type:707});
						else{
							socket.send({type:706,mapid:__index});
							timestamp("User saved map with map ID:", __index);
						}
					});
				}
				else socket.send({type:708});
			});
		});
	});
	socket.on('mapdata update', function(userpass, input_data){

		db.users.find({username:userpass.name}, function(err, data){
			if(err || data.length==0){
				socket.send({type:700});
				return;
			}
			if(data[0].password!=userpass.pass)
			{	// invalid username and password -- possible potential hijacking attempt
				socket.send({type:700});
				timestamp("Possible potential hijacking attempt targeted at user:", userpass.name);
				return;
			}
		});
		db.gamedata.find({Map_Id:input_data.index}, function(err, data){
			if(err){
				socket.send({type:777});
				return;
			}
			if(data.length!=0){
				if(data[0].mapowner!=userpass.name)
				{
					timestamp("Usernames do not match -- Potential Highjacking attempt:", data[0].Map_Id);
					socket.send({type:709});
					return;
				}
				db.gamedata.update({Map_Id:data[0].Map_Id}, {$set:{
					mapdata:input_data.map,
					playtested:false,
					PUBLISHED:false
				}}, function(err, saved){
					if(err||!saved)socket.send({type:707});
					else{
						socket.send({type:710});
						timestamp("MAP EDITOR -> "+userpass.name+" updated map with map ID:", input_data.index);
					}
				});
			}
			else socket.send({type:709});
		});
	});
	socket.on('mapdata mark playtested', function(userpass, mapid){

		db.users.find({username:userpass.name}, function(err, data){
			if(err || data.length==0){
				socket.send({type:700});
				return;
			}
			if(data[0].password!=userpass.pass)
			{	// invalid username and password -- possible potential hijacking attempt
				socket.send({type:700});
				timestamp("Possible potential hijacking attempt targeted at user:", userpass.name);
				return;
			}
		});
		db.gamedata.find({Map_Id:mapid}, function(err, data){
			if(err){
				socket.send({type:777});
				return;
			}
			if(data.length!=0){
				if(data[0].mapowner!=userpass.name)
				{
					timestamp("Usernames do not match -- Potential Highjacking attempt:", data[0].Map_Id);
					socket.send({type:709});
					return;
				}
				db.gamedata.update({Map_Id:mapid}, {$set:{
					playtested:true,
					last_playtested:new Date()
				}}, function(err, saved){
					if(err||!saved)socket.send({type:707});
					else{
						socket.send({type:710});
						timestamp("MAP EDITOR -> "+userpass.name+" playtested map with map ID:", data[0].Map_Id);
					}
				});
			}
			else socket.send({type:709});
		});
	});
	socket.on('mapdata delete', function(userpass, mapid){
		db.users.find({username:userpass.name}, function(err, data){
			if(err || data.length==0){
				socket.send({type:700});
				return;
			}
			if(data[0].password!=userpass.pass)
			{	// invalid username and password -- possible potential hijacking attempt
				socket.send({type:700});
				timestamp("Possible potential hijacking attempt targeted at user:", userpass.name);
				return;
			}
		});
		db.gamedata.find({Map_Id:mapid}, function(err, data){
			if(err){
				socket.send({type:777});
				return;
			}
			if(data.length!=0){
				if(data[0].mapowner!=userpass.name)
				{
					timestamp("Usernames do not match -- Potential Highjacking attempt:", data[0].Map_Id);
					socket.send({type:709});
					return;
				}
				db.gamedata.remove({Map_Id:mapid}, function(err, saved){
					if(err||!saved)socket.send({type:707});
					else{
						socket.send({type:710});
						timestamp("MAP EDITOR -> "+userpass.name+" deleted map with map ID:", data[0].Map_Id);
					}
				});
			}
			else socket.send({type:709});
		});
	});
	socket.on('mapdata publish', function(userpass, mapid){
		db.users.find({username:userpass.name}, function(err, data){
			if(err || data.length==0){
				socket.send({type:700});
				return;
			}
			if(data[0].password!=userpass.pass)
			{	// invalid username and password -- possible potential hijacking attempt
				socket.send({type:700});
				timestamp("Possible potential hijacking attempt targeted at user:", userpass.name);
				return;
			}
		});
		db.gamedata.find({Map_Id:mapid}, function(err, data){
			if(err){
				socket.send({type:777});
				return;
			}
			if(data.length!=0){
				if(data[0].mapowner!=userpass.name)
				{
					timestamp("Usernames do not match -- Potential Highjacking attempt:", data[0].Map_Id);
					socket.send({type:709});
					return;
				}
				db.gamedata.update({Map_Id:mapid}, {$set:{
					PUBLISHED:true,
					publish_date:new Date()
				}}, function(err, saved){
					if(err||!saved)socket.send({type:707});
					else{
						socket.send({type:710});
						timestamp("MAP EDITOR -> "+userpass.name+" PUBLISHED map with map ID:", data[0].Map_Id);
					}
				});
			}
			else socket.send({type:709});
		});
	});

	socket.on('gamedata id', function(mapid){
		db.gamedata.find({Map_Id:mapid, PUBLISHED:true}, function(err, data){
			if(err){
				socket.send({type:500,errType:0});
				return;
			}
			if(data.length==0){
				socket.send({type:501});
				return;
			}
			socket.send({type:502, data:data[0].mapdata});
		});
	});
	socket.on('gamedata get', function(sort_by, start_index, end_amt, userSearch){
		sort_by.PUBLISHED = true;
			/// let users search for things that just contain and aren't exact matches
		if(sort_by.mapowner!=null)
		if(sort_by.mapowner.charAt(0)=="^")
		{
			sort_by.mapowner = RegExp(".*"+sort_by.mapowner.substring(1, sort_by.mapowner.length)+".*", 'i');
		}
		let _search_name = sort_by.mapdata;
		if(_search_name!=null)
			sort_by.mapdata = RegExp(".*");

		db.gamedata.find(sort_by, function(err, data){
			if(err){
				socket.send({type:500,errType:1});
				return;
			}
			if(data.length==0){
				if(sort_by.mapowner==null)
				{
					socket.send({type:501});
					return;
				}
				sort_by.mapdata = RegExp(".*" + _search_name + ".*");
				sort_by.mapowner = RegExp(".*");

				db.gamedata.find(sort_by, function(err, data){
					if(err){
						socket.send({type:500,errType:2});
						return;
					}
					if(data.length==0){
						socket.send({type:501});
						return;
					}
					let arr = new Array();

					for(let i=0;i<end_amt && i<data.length;i++)
					{
						arr.push({
							game:data[data.length-i-1].mapdata,
							name:data[data.length-i-1].mapowner
						});
					}

					socket.send({type:503, data:arr});
				});
				return;
			}
			let arr = new Array();

			for(let i=0;i<end_amt && i<data.length;i++)
			{
				arr.push({
					game:data[data.length-i-1].mapdata,
					mapid:data[data.length-i-1].Map_Id,
					name:data[data.length-i-1].mapowner
				});
			}

			socket.send({type:503, data:arr});
		});
	});

	socket.on('new user', function(username, password, email){
		if(socket.vars.online)return;
		db.users.find({username:username}, function(err, data){
			if(err){
				socket.send({type:8});
				return;
			}
			if(data.length==0){
				cryptPassword(password, function functionName(err, hashPass) {
					if(err!=null)
					{
						socket.send({type:8});
						return;
					}
					db.users.save({
						pic:null,
						username:username,
						password:hashPass,
						email:email,
						story_prog:[1,1,1],
						level:1,
						points:0,
						totalGames:0,
						gamesWon:0
					}, function(err, saved){
					if(err||!saved)socket.send({type:8});
					else{
						socket.send({type:9});
						timestamp("New user",saved.username,"added");
					}
				});
				});
			}
			else socket.send({type:5});
		});
	});
	socket.on('connect user', function(username, password){
		if(socket.vars.online)return;
		db.users.find({username:username}, function(err, data){
			if(err||!data||data.length==0){
				socket.send({type:6});
				return;
			}
			if(data.length==1){
				comparePassword(password, data[0].password, function(err, is_correct) {
					if(!is_correct){
						socket.send({type:7});
						return;
					}
					var activeCons = Connections.Active();
					var rejoined = false;
					for(var i in activeCons){
						if(activeCons[i].username!=username)continue;
						if(!activeCons[i].vars.online){
							Connections.Reconnect(activeCons[i].index, socket);
							rejoined = true;
							var game = Game_List.Game(socket.vars.in_game);
							if(game){
								game.Rejoin(SUDO_ROUTE_PASS, socket.vars.slotIndex, socket.index);
							}
							break;
						}else{
							timestamp("ERROR: user",username,"tried to join twice at once");
							socket.send({type:8});
							return;
						}
					}
					if(!rejoined){
						socket.index = Connections.Add(socket);
						socket.username = username;
						timestamp("user",username,"connected:",socket.index);
					}
					socket.send({
						type:20,
						index:socket.index
					});
					socket.vars.online = true;
					socket.broadcast.emit('user joined', socket.username);
				});
				return;
			}
			socket.send({type:8});
		});
	});
	socket.on('disconnect', function(){
		if(!socket.vars.online)return;
		socket.vars.online = false;
		// echo globally that this client has left
		socket.broadcast.emit('user left', socket.username);
		var game = Game_List.Game(socket.vars.in_game);
		if(game){	// if in game, allow 30 secs to reconnect before removal
			game.Leave(SUDO_ROUTE_PASS, socket.index, 30000, function(){
					// if they reconnect the system will auto join them to the game
					// if they havent reconnected after 30secs, remove them from server
				Connections.Disconnect(socket.index);
			});
			return;
		}
		Connections.Disconnect(socket.index);
	});
	socket.on('userdata get', function(query){
		db.users.findOne({username:socket.username}, function(err, data){
			if(err){
				socket.send({type:500,errType:3});
				return;
			}
			if(data==null){
				socket.send({type:500,errType:4});
				return;
			}
			if(query=="profile")
			{	// all open data for connected user, hiding important data
				let requestData = {};
				requestData.username = data.username;
				requestData.level = data.level;
				requestData.points = data.points;
				requestData.email = data.email;
				requestData.gamesWon = data.gamesWon;
				requestData.totalGames = data.totalGames;
				requestData.pic = data.pic;
				socket.send({type:300, profile:requestData});
				return;
			}
			if(query=="progress")
			{	// unlocked story data
				socket.send({type:504, story_prog:data.story_prog});
				return;
			}
		});
	});
	socket.on('userdata add', function(query){
		db.users.findOne({username:socket.username}, function(err, data){
			if(err){
				socket.send({type:500,errType:5});
				return;
			}
			if(data==null){
				socket.send({type:500,errType:6});
				return;
			}
			if(query.type=="progress")
			{	// unlock next story level
				if(query.section<0 || query.section>=3)
				{	// invalid input error
					socket.send({type:500,errType:7});
					return;
				}
				let __progress = data.story_prog;
				if(__progress[query.section]>=5)
				{	// cannot grow level further
					socket.send({type:601});
					return;
				}
				__progress[query.section]++;
				socket.send({type:600, story_prog:__progress, section:query.section});
				db.users.update({username:socket.username}, {$set:{
					story_prog:__progress
				}});
			}
		});
	});
	socket.on('userdata update', function(query){
		db.users.findOne({username:socket.username}, function(err, data){
			if(err){
				socket.send({type:500,errType:5});
				return;
			}
			if(data==null){
				socket.send({type:500,errType:6});
				return;
			}
			if(query.type=="email")
			{	// starts email verification process
				if(!DATA_CHECK("email", query.new_email))
				{	// invalid input error
					socket.send({type:500,errType:8,error:"email"});
					return;
				}

				let CODE = 123456789;
				DATA_CHECK("SET verify email", {
					user:socket.username,
					new_email:query.new_email,
					code:CODE
				});

				SEND_EMAIL("verify email", {
					name:socket.username,
					email:socket.email,
					code:CODE
				});
			}
			if(query.type=="verify email")
			{	// finishes email verification process and updates new email if succesful
				if(!DATA_CHECK("email", query.new_email))
				{	// invalid input error
					socket.send({type:500,errType:8,error:"email"});
					return;
				}
				if(!DATA_CHECK("verify email", {
					user:socket.username,
					new_email:query.new_email,
					code:query.verify_code
				}))
				{	// invalid input error
					socket.send({type:500,errType:8,error:"verify email"});
					return;
				}

				// here is the final email update, after verification
				db.users.update({username:socket.username}, {$set:{
					email:query.new_email
				}});
				timestamp("user",socket.username,"updated email.");
				SEND_EMAIL("email", {
					name:socket.username,
					email:query.new_email
				});
				return;
			}
			if(query.type=="password")
			{	// update password
				if(!DATA_CHECK("password", query.new_pass))
				{	// invalid input error
					socket.send({type:500,errType:8,error:"password"});
					return;
				}

					// encrypt passwords
				cryptPassword(query.new_pass, function functionName(err, hashPass) {
					if(err!=null)
					{
						socket.send({type:500,errType:8,error:"encryption"});
						return;
					}
						// update stored password
					db.users.update({username:socket.username}, {$set:{
						password:hashPass
					}});
					timestamp("user",socket.username,"updated their password.");
					SEND_EMAIL("password", {
						email:socket.email
					});
				});
				return;
			}
			if(query.type=="pic")
			{	// update profile pic
				if(!DATA_CHECK("pic", query.new_pic))
				{	// invalid input error
					socket.send({type:500,errType:8,error:"pic"});
					return;
				}

				// update profile pic
				db.users.update({username:socket.username}, {$set:{
					pic:query.new_pic
				}});
				timestamp("user",socket.username,"updated their picture.");
				return;
			}
		});
	});

	socket.on('print data', function(){
		timestamp("!** Request to print data by:", socket.username);
		if(socket.username!="storm")
			return;	// check for admin permission
		timestamp("Request permitted to:", socket.username);

		db.users.find({}, function(err, data){
			if(err||!data){
				timestamp("***Error printing user data.");
			}else{
				timestamp("***user data: ");
				data.forEach(function(cur){
					console.log("-->",cur.username);
					console.log(cur);
				});
			}
		});
		db.games.find({}, function(err, data){
			if(err||!data){
				timestamp("***Error printing game data.");
			}else{
				timestamp("***game data: ");
				data.forEach(function(cur){
					console.log(cur.username, cur.password);
				});
			}
		});
		/* console.log("Connections",Connections.Amount());
		for(var i=0;i<Connections.Length();i++)
		{
			if(Connections.Socket(i)!=null)
			{
				console.log(i, Connections.Socket(i).username, Connections.Socket(i).vars.in_game);
			}
			else console.log(i, null);
		}
		console.log("Game_List",Game_List.Amount(),Game_List.Active().length);
		for(var i=0;i<Game_List.Length();i++)
		{
			if(Game_List.Game(i)!=null)
			{
				console.log(i, Game_List.Game(i).Name(), Game_List.Game(i).index_in_server, Game_List.Game(i).Data());
			}
			else console.log(i, null);
		} */
		console.log("Lobby",Lobby.list.length);
		for(var i=0;i<Lobby.list.length;i++)
		{
			console.log(i, Lobby.list[i]);
		}
		timestamp("Print data done");
	});

	socket.on('check', function(){
		if(socket.vars.online)socket.send({type:0});
		else socket.send({type:4});
	});
});
