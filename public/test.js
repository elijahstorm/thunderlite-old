var data_list = function(){
	this.list = [];
	this.Add = function(data)
	{
		var i = 0;
		for(;i<this.list.length;i++)
		{
			if(this.list[i]==null)break;
		}
		this.list[i] = data;
		return i;
	};
	this.Remove = function(index)
	{
		if(index>=this.list.length)return false;
		var removed = this.list[index];
		this.list[index] = null;
		for(var i=index+1;i<this.list.length;i++)
		{
			if(this.list[i]!=null)return removed;
		}
		var last_good = index;
		for(;last_good>0;last_good--)
		{
			if(this.list[last_good-1]!=null)break;
		}
		this.list.splice(last_good, this.list.length-last_good);
		return removed;
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
		if(index>=active.list.length)return null;
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
		if(!user)return;
		amt--;
		timestamp("user "+user.username+" disconnected");
	};
	this.Reconnect = function(index, socket)
	{
		if(index>=active.list.length)return;
		var oldSocket = active.list[index];
		socket.index = index;
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
		timestamp("Invalid passkey attempt in Game",self.index_in_server);
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
		self.Send(input_passkey, {type:15,game:lastValidGameState});
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

			// here is where debug begins
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
			map:gamestate,
			game:game.index_in_server,
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
	this.Game = function(index, input_passkey)
	{
		if(index==null)return null;
		if(index>=games.list.length)return null;
		return games.list[index];
	};
	this.Close = function(index, input_passkey)
	{
		var cur = games.Remove(index);
		if(!cur)return;
		amt--;
		timestamp("Game",cur.index_in_server,"->",cur.Name(),"closed");
	};
};
let Game_List = new gl_handler();
let Lobby = new data_list();


function open(map, name, slots){
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
}
function join(game_id){
	// search node
	var game = Game_List.Game(game_id);
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
	for(var i in connections)
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
}
function leave(__input_passkey){
	var game = Game_List.Game(socket.vars.in_game);
	if(game==null)return;
	game.Leave(__input_passkey, socket.index);
	socket.vars.in_game = null;
	socket.vars.lobby_listening = true;
	timestamp(socket.username,"left game",game.Name());
}
function close(){
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
}
function start(){
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
	for(var i in players)
	{
		if(players[i]==null)continue;
		Connections.Socket(players[i]).vars.lobby_listening = false;
	}
	game.started = true;
	timestamp("Game",game.index_in_server,"->",game.Name(),"started");
	send_lobby_info({
		type:25,
		game:socket.vars.in_game
	}, socket.index);
	Lobby.Remove(game.lobby);
	game.lobby = -1;
}
