var backCanvas,charCanvas,moveUnitCanvas;
var dialogCanvas,tileCanvas,uiCanvas,worldCanvas;
var hudCanvas,avatarCanvas,terrainCanvas;
var statsCanvas,imageHolderCanvas;
var overlayCanvas,animationCanvas;
var menuCanvas,devCanvas,logCanvas;
var inputHandler;
var Background_Display,
	Character_Display,
	Tile_Display,
	HUD_Display,
	Avatar_Display,
	Stats_Display;
let MUSIC;
var FRAMERATEDISPLAY;
var lastLoop = new Date;
var parentFrame = window.parent.document.getElementById('gameFrame');

var	fps = 30,
	paused = false,
	currently_playing = false,
	gameInProgress = false,
	speedAdjustmentUp = false;
var tpf = 1000/fps;

var LOG = {
	container:document.getElementById("logger-container"),
	popup:function(text){
		const POPUP = document.createElement('h5');
		POPUP.className = "logger-popup w3-brown";
		POPUP.innerHTML = text;
		LOG.container.appendChild(POPUP);
		POPUP.addEventListener('click', function() {
			POPUP.style.opacity = '0';
			POPUP.style.transform =  "translate(-300px, 0px)";
		});
		let exitOnce = false;
		POPUP.addEventListener('mouseover', function() {
			if(exitOnce)return;
			setTimeout(function() {
				POPUP.style.opacity = '0';
				POPUP.style.transform =  "translate(-300px, 0px)";
			}, 2000);
		});
		POPUP.addEventListener('transitionend', () => POPUP.remove());
		if(LOG.first_popup)
		{
			LOG.first_popup = false;
			if(INTERFACE!=null)
			if(!INTERFACE.IS_MOBILE_GAME)
			{
				LOG.popup("Click to remove logs. Moving your mouse over a log will remove it after two seconds.");
				return;
			}
			LOG.popup("Tap to remove logs.");
		}
	},
	first_popup:true
};

var Core = {
	Target_Class:function(input)
	{
		var Move_Class = function(input)
		{
			var x = input[0];
			var y = input[1];
			this.X = function()
			{
				return x;
			};
			this.Y = function()
			{
				return y;
			};
		};
		var map = [];
		for(var i=0;i<input.length;i++)
		{
			map[i] = new Move_Class(input[i]);
		}
		this.at = function(index)
		{
			return map[index];
		};
		this.length = function()
		{
			return map.length;
		};
	},
	Target:{
		Diamond:function(rad, start, core)
		{
			var so_far = [];
			if(start==null)
			{
				start = 1;
				so_far[0] = [0,0];
			}
			else if(core||core==null)
				so_far[0] = [0,0];
			for(var i=start;i<=rad;i++)
			{
				so_far.push([i,0]);
				so_far.push([-i,0]);
				so_far.push([0,i]);
				so_far.push([0,-i]);
				for(var j=1;j<i;j++)
				{
					so_far.push([i-j,j]);
					so_far.push([j-i,j]);
					so_far.push([i-j,-j]);
					so_far.push([j-i,-j]);
				}
			}
			return so_far;
		},
		Circle:function(rad, offset, core)
		{
			var so_far = [];
			if(offset==null)
			{
				offset = 0;
				so_far[0] = [0,0];
			}
			else if(core||core==null)
				so_far[0] = [0,0];
			// for(var i=offset+1;i<=rad;i++)
			// for(var j=0;j<i;j++)
			// {
				// so_far.push([i-j,j];
				// so_far.push([j-i,j];
				// so_far.push([j,i-j];
				// so_far.push([j,j-i];
			// }
			return so_far;
		},
		Square:function(len, offset, core)
		{
			var so_far = [];
			if(offset==null)
			{
				offset = 0;
				so_far[0] = [0,0];
			}
			else if(core||core==null)
				so_far[0] = [0,0];
			for(var i=offset+1;i<=len;i++)
			{
				so_far.push([i,0]);
				so_far.push([-i,0]);
				for(var j=1;j<=len;j++)
				{
					so_far.push([i,j]);
					so_far.push([-i,j]);
					so_far.push([i,-j]);
					so_far.push([-i,-j]);
				}
				so_far.push([0,i]);
				so_far.push([0,-i]);
				for(j=1;j<=offset;j++)
				{
					so_far.push([j,i]);
					so_far.push([j,-i]);
					so_far.push([-j,i]);
					so_far.push([-j,-i]);
				}
			}
			return so_far;
		},
		X:function(len, offset, core)
		{
			var so_far = [];
			if(offset==null)
			{
				offset = 0;
				so_far[0] = [0,0];
			}
			else if(core||core==null)
				so_far[0] = [0,0];
			for(var i=offset+1;i<=len;i++)
			{
				so_far.push([i,i]);
				so_far.push([-i,i]);
				so_far.push([i,-i]);
				so_far.push([-i,-i]);
			}
			return so_far;
		},
		Plus:function(len, offset, core)
		{
			var so_far = [];
			if(offset==null)
			{
				offset = 0;
				so_far[0] = [0,0];
			}
			else if(core||core==null)
				so_far[0] = [0,0];
			for(var i=offset+1;i<=len;i++)
			{
				so_far.push([0,i]);
				so_far.push([0,-i]);
				so_far.push([i,0]);
				so_far.push([-i,0]);
			}
			return so_far;
		},
		T:function(len, width, offset, core)
		{
			var so_far = [];
			if(offset==null)
			{
				offset = 0;
				so_far[0] = [0,0];
			}
			else if(core||core==null)
				so_far[0] = [0,0];
			for(var i=offset+1;i<=len;i++)
			{
				so_far.push([0,i]);
				so_far.push([0,-i]);
				so_far.push([i,0]);
				so_far.push([-i,0]);
			}
			for(var i=1;i<=width;i++)
			{
				so_far.push([len,i]);
				so_far.push([len,-i]);
				so_far.push([-len,i]);
				so_far.push([-len,-i]);
				so_far.push([i,len]);
				so_far.push([-i,len]);
				so_far.push([i,-len]);
				so_far.push([-i,-len]);
			}
			return so_far;
		}
	},
	Smooth_Changer:function(drawable, value, change, i, callback)
	{
		if(i<=0)
		{
			if(callback!=null)callback(drawable);
			return;
		}
		value.Set(value.Get()+change);
		setTimeout(function(){Core.Smooth_Changer(drawable,value,change,i-1,callback);},tpf);
	},
	Fade_Drawable:function(drawable, end_val, frames, callback)
	{
		var change = (end_val-drawable.Alpha.Get())/frames;
		Core.Smooth_Changer(drawable,drawable.Alpha,change,frames,function(data){
			drawable.Alpha.data = end_val;
			if(callback!=null)callback(data);
		});
	},
	Grow_Drawable:function(drawable, end_width, end_height, frames, callback)
	{
		var change = (end_width-drawable.Width.Get())/frames;
		Core.Smooth_Changer(drawable,drawable.Width,change,frames,callback);
		change = (end_height-drawable.Height.Get())/frames;
		Core.Smooth_Changer(drawable,drawable.Height,change,frames,function(){});
	},
	Slide_Drawable_X:function(drawable, x_off, frames, callback)
	{
		var change = x_off/frames;
		Core.Smooth_Changer(drawable,drawable.X,change,frames,callback);
	},
	Slide_Drawable_Y:function(drawable, y_off, frames, callback)
	{
		var change = y_off/frames;
		Core.Smooth_Changer(drawable,drawable.Y,change,frames,callback);
	},
	Slide_Drawable:function(drawable, x_off, y_off, frames, callback)
	{
		var change = x_off/frames;
		Core.Smooth_Changer(drawable,drawable.X,change,frames,callback);
		change = y_off/frames;
		Core.Smooth_Changer(drawable,drawable.Y,change,frames,function(){});
	},
	Exploding:false,
	Point:function(Game, terrain)
	{
		if(terrain.pointer!=null)return;
		let x = terrain.X,
			y = terrain.Y;

		let ani = Animations.Retrieve("Pointer Animation");
		let d = ani.New(HUD_Display.Context,
			x*TILESIZE-INTERFACE.X_Offset(),
			y*TILESIZE-INTERFACE.Y_Offset(), ani.Width*TILESIZE/60, ani.Height*TILESIZE/60, true);
		ani.Stop = false;
		terrain.pointer = d;
	},
	Unpoint:function(Game, terrain)
	{
		if(terrain.pointer==null)return;
		let x = terrain.X,
			y = terrain.Y;

		let ani = Animations.Retrieve("Pointer Animation");
		let values = terrain.pointer.values;
		values.show = false;
		ani.Clear(HUD_Display.Context, values.x, values.y, ani.Width*TILESIZE/60, ani.Height*TILESIZE/60);
		terrain.pointer = null;
		ani.Remove(values.index);
	},
	Explode:function(selectable, callback)
	{
		let ani = Animations.Retrieve("Explosion");
		let d = ani.New(HUD_Display.Context,
			selectable.X*TILESIZE-INTERFACE.X_Offset()+2,
			(selectable.Y-.7)*TILESIZE-INTERFACE.Y_Offset(), ani.Width*TILESIZE/60, ani.Height*TILESIZE/60, true);
		ani.Stop = false;
		selectable.Fade(0, 6);
		ani.onEnd(function(){
			selectable.Remove_From_Game();
			ani.Remove(d.values.index);
			Core.Exploding = false;
			if(callback!=null)
				callback();
		});

		if(Core.Exploding)return;
		Core.Exploding = true;
		SFXs.Retrieve('explosion').Play(Math.floor(Math.random()*4));
	},
	Array:{
		Clone:function(arr)
		{
			var temp = [];
			for(var i in arr)
			{
				temp[i] = arr[i];
			}
			return temp;
		},
		Equals:function(arr1, arr2)
		{
			if(arr1.length!=arr2.length)return false;
			for(var i=0;i<arr1.length;i++)
			{
				if(arr1[i]!=arr2[i])return false;
			}
			return true;
		},
		Equal_Position:function(pos1, pos2)
		{
			if(pos1[0]==pos2[0])
			if(pos1[1]==pos2[1])
				return true;
			return false;
		},
		Similar_Nodes:function(arr1, arr2)
		{
			var both = [];
			for(var i=0;i<arr1.length;i++)
			for(var j=0;j<arr2.length;j++)
			{
				if(Core.Array.Equals(arr1[i],arr2[j]))
				{
					both.push(arr1[i]);
				}
			}
			return both;
		},
		Overlapping_Positions:function(arr1, arr2)
		{
			var both = [];
			for(var i=0;i<arr1.length;i++)
			for(var j=0;j<arr2.length;j++)
			{
				if(Core.Array.Equal_Position(arr1[i],arr2[j]))
				{
					both.push(arr1[i]);
				}
			}
			return both;
		},
		Remove_Array_Index:function(arr, index)
		{
			var found = false;
			var temp_arr = [];
			for(var i in arr)
			{
				if(index==i)
				{
					found = true;
					delete arr[i];
					continue;
				}
				temp_arr[i] = arr[i];
			}
			if(!found)
			{
				console.error("Could not find "+index+" to delete.");
				return false;
			}
			arr = temp_arr;
			return true;
		},
		Organize:{
			Ascending:function(input)
			{
				var arr = Core.Array.Clone(input);
				if(arguments.length==1)
				{
					for(var step=0;step<arr.length-1;++step)
					for(var i=0;i<arr.length-step-1;++i)
					{
						if(arr[i]>arr[i+1])
						{
							var temp = arr[i];
							arr[i] = arr[i+1];
							arr[i+1] = temp;
						}
					}
					return;
				}
				for(var step=0;step<arr.length-1;++step)
				for(var i=0;i<arr.length-step-1;++i)
				{
					for(var order_by=1;order_by<arguments.length;order_by++)
					{
						var left = arguments[order_by](arr[i]);
						var right = arguments[order_by](arr[i+1]);
						if(left==right)continue;
						if(left>right)
						{
							var temp = arr[i];
							arr[i] = arr[i+1];
							arr[i+1] = temp;
						}
						break;
					}
				}
				return arr;
			},
			Descending:function(input)
			{
				var arr = Core.Array.Clone(input);
				if(arguments.length==1)
				{
					for(var step=0;step<arr.length-1;++step)
					for(var i=0;i<arr.length-step-1;++i)
					{
						if(arr[i]<arr[i+1])
						{
							var temp = arr[i];
							arr[i] = arr[i+1];
							arr[i+1] = temp;
						}
					}
					return;
				}
				for(var step=0;step<arr.length-1;++step)
				for(var i=0;i<arr.length-step-1;++i)
				{
					for(var order_by=1;order_by<arguments.length;order_by++)
					{
						var left = arguments[order_by](arr[i]);
						var right = arguments[order_by](arr[i+1]);
						if(left==right)continue;
						if(left<right)
						{
							var temp = arr[i];
							arr[i] = arr[i+1];
							arr[i+1] = temp;
						}
						break;
					}
				}
				return arr;
			},
			Reverse:function(arr)
			{
				var temp = [];
				for(var i=0;i<arr;i++)
				{
					temp[i] = arr[arr.length-i-1];
				}
				return temp;
			}
		}
	},
	Object:{
		Clone:function(obj) {
			let clone = {};
			for (let i in obj) {
				clone[i] = obj[i];
			}
			return clone;
		}
	}
};

var online = false;
var socket;
var LOADER;
window.onload = function(){
	if(window.parent)socket = window.parent.socket;
	if(socket)online = true;
	LOG.container = document.getElementById("logger-container");

	// game setup
	FRAMERATEDISPLAY = document.getElementById("frames");
	FRAMERATEDISPLAY.value = 0;
	FRAMERATEDISPLAY.update = 0;
	Canvas.Add_Ticker(function(){
		var thisLoop = new Date;
		var _fps = Math.round(1000/(thisLoop-lastLoop));
		lastLoop = thisLoop;
		if(Math.abs(FRAMERATEDISPLAY.value-_fps)>5)FRAMERATEDISPLAY.update+=5;
		if(++FRAMERATEDISPLAY.update>=30)
		{
			FRAMERATEDISPLAY.update = 0;
			FRAMERATEDISPLAY.innerHTML= ("0"+_fps.toString()).slice(-2) + "/" + fps.toString() + " FPS";
			FRAMERATEDISPLAY.value = _fps;
			if(_fps<10)
				FRAMERATEDISPLAY.style.color = "#f00";
			else if(_fps<20)
				FRAMERATEDISPLAY.style.color = "#909310";
			else
				FRAMERATEDISPLAY.style.color = "#12790b";
		}
	});

		// this is the loading screen
	let tick_counter = 0;
	LOADER = Canvas.Add_Ticker(function(){
		tick_counter++;
		if(tick_counter<15)return;
		tick_counter = 0;
		if(Math.random()>.5)
		{
			let el = document.createElement('div');
			el.style.position = "absolute";
			el.style.top = (Math.random()*500)+"px";
			el.style.left = (Math.random()*500)+"px";
			el.className = "lds-ripple fade_in";
			setTimeout(function() {
				el.style.opacity = 1;
			}, 10);

			el.appendChild(document.createElement('div'));
			el.appendChild(document.createElement('div'));
			document.getElementById("loading-background").appendChild(el);

			setTimeout(function() {
				el.style.opacity = 0;
				setTimeout(function() {
					el.remove();
				}, 500);
			}, 1300);
		}
	});

	imageHolderCanvas = initiateCanvas("imageHolder");

	backCanvas = initiateCanvas("backgroundCanvas");
	Background_Display = Canvas.Create_Canvas(backCanvas, "back");

	worldCanvas = initiateCanvas("worldCanvas");
	terrainCanvas = initiateCanvas("terrainCanvas");
	charCanvas = initiateCanvas("charCanvas");

	moveUnitCanvas = initiateCanvas("moveUnitCanvas");
	buildingCanvas = initiateCanvas("buildingCanvas");
	weatherCanvas = initiateCanvas("weatherCanvas");

	tileCanvas = initiateCanvas("tileCanvas");
	Tile_Display = Canvas.Create_Canvas(tileCanvas, "tile");
	uiCanvas = initiateCanvas("uiCanvas");

	animationCanvas = initiateCanvas("animationCanvas");
	overlayCanvas = initiateCanvas("overlayCanvas");
	menuCanvas = initiateCanvas("menuCanvas");
	devCanvas = initiateCanvas("devCanvas");
	logCanvas = initiateCanvas("logCanvas");
	inputHandler = initiateCanvas("inputHandler");

	hudCanvas = initiateCanvas("hudCanvas");
	HUD_Display = Canvas.Create_Canvas(hudCanvas, "hud");

			/// LOAD FREE MAPS DATA
	socket.emit('userdata get', "progress");

	INTERFACE = new Interface_Class;
	dialogCanvas = initiateCanvas("dialogCanvas");
	Dialog_Display = Canvas.Create_Canvas(dialogCanvas, "dialog");

	Dialog = new Dialog_Class(dialogCanvas);
	for(var i in onInterfaceLoadedList){
		onInterfaceLoadedList[i](INTERFACE);
	}
	onInterfaceLoadedList = null;
	document.getElementById("endTurn").onclick = function(){
		if(!INTERFACE.Game)return;
		if(INTERFACE.Game.Client_Player().Active)
		{
			INTERFACE.Select_Tile();
			INTERFACE.Game.Send_Move('next player', JSON.stringify(INTERFACE.Game.Data(true)));
			INTERFACE.Game.Client_Player().End_Turn();
		}
	};
	Canvas.Reflow();
	Canvas.Next_Tick();

	mainMenu();
};

var INTERFACE;
var onInterfaceLoadedList = [];
function onInterfaceLoaded(fnc){
	if(onInterfaceLoadedList==null)return;
	onInterfaceLoadedList.push(fnc);
}

function encrypt_game_data(data)
{
	var encrypted = "";
	for(var i=0;i<data.length;i++)
		encrypted+=String.fromCharCode(data.charCodeAt(i)+50);
	return encrypted;
}
function decrypt_game_data(data)
{
	var encrypted = "";
	for(var i=0;i<data.length;i++)
		encrypted+=String.fromCharCode(data.charCodeAt(i)-50);
	return encrypted;
}
const copyToClipboard = str => {
	try {
	  const el = document.createElement('textarea');
	  el.value = str;
	  document.body.appendChild(el);
	  el.select();
	  document.execCommand('copy');
	  document.body.removeChild(el);
		LOG.popup("Copied!");
	} catch (e) {
		LOG.popup("Could not copy");
	}
};

function toggle_pregame_info(element)
{
	if(element.className.indexOf("inactive")!=-1)
		return;

	LOG.popup("Sorry. Feature disabling won't take affect until next update.");

	if(element.id)
	switch (element.id) {
		case "_weather":
			if(element.innerHTML=="OFF")
				element.innerHTML = "ON";
			else element.innerHTML = "OFF";
			break;
		case "_turnlimit":

			break;
		case "_ranked":
			if(element.innerHTML=="NO")
				element.innerHTML = "YES";
			else element.innerHTML = "NO";
			break;
	}
}
function init_map(map, players, game_id, skip_pregame, offline_game)
{
	var Game = new Engine_Class(map);
	if(offline_game!=null)
	if(offline_game[0])
	{
		Game.game_data[0] = true;
		Game.game_data[2] = offline_game[1];
		if(offline_game[2]==1)
			Game.game_data[3] = 1;
		else if(offline_game[2]==2)
		{
			Game.game_data[3] = 2;
			Game.game_data[4] = offline_game[3];
		}
		else if(offline_game[2]==3)
			Game.game_data[3] = 3;
	}
	Animations.Retrieve("Load").Remove_All();
	Game.id = game_id;
	Game.Map = map;
	INTERFACE.Close_Menu();
	INTERFACE.setGame(Game);
	INTERFACE.Set_Controls(document.getElementById("inputHandler"));
	INTERFACE.Allow_Controls(true);
	Canvas.Clear();
	Canvas.Set_Game(Game);
	Canvas.Redraw();
	Canvas.Start_All();
	gameInProgress = true;
	window.parent.setConnection(2);
	Levels.Run_Script(Game, map.Data.Get().__script);

	if(skip_pregame)
	{
		if(players!=null)
		{
			var set = false;
			for(var i in players.c)
			{
				if(players.c[i]==null)
				{
					if(!set)
					{
						Game.Set_Player(i, socket.index, socket.username, true);
						set = true;
					}
					continue;
				}
				Game.Set_Player(i, players.c[i], players.n[i], false);
			}
		}
		else Game.Set_Player(0, socket.index, socket.username, true);
		INTERFACE.Game.Host_Game(socket.game_id);
		return;
	}

	Menu.PreGame.Setup_Map(map);
	if(players!=null)
	{
		for(let i in players.c)
		{
			if(players.c[i]==null)continue;
			Game.Set_Player(i, players.c[i], players.n[i], players.n[i]==socket.username);
			Menu.PreGame.Set(i, players.n[i]);
		}
	}
	else
	{
		Game.Set_Player(0, socket.index, socket.username, true);
		Menu.PreGame.Set(0, socket.username);
		Menu.PreGame.AddStarter(map.Name);
	}
}
function new_custom_game(game_data, game_setup, skippingLobby, save_data_index, story_progress, story_section)
{
	if(game_data==null || game_setup==null)return;

	let data;
	if(game_data.Valid)
		data = game_data;
	else data = Map_Reader.String(game_data);
	if(!data.Valid)return;

	if(!skippingLobby)
		changeContent("HOST GAME", game_setup);

	init_map(data, null, null, skippingLobby, [skippingLobby, save_data_index, story_progress, story_section]);

	if(online){
		socket.emit("open", data.id, game_setup[0], data.Player_Amount());
	}
}
function load_game(data)
{
	let _gamestate_data = JSON.parse(data.gamestate);
	let GAMESTATE = Map_Reader.Gamestate(_gamestate_data);
	var Game = new Engine_Class(GAMESTATE);

	Game.id = socket.game_id;
	Game.Map = GAMESTATE;
	INTERFACE.setGame(Game);
	INTERFACE.Set_Controls(document.getElementById("inputHandler"));
	INTERFACE.Allow_Controls(true);
	Canvas.Clear();
	Canvas.Set_Game(Game);
	Canvas.Redraw();
	Canvas.Start_All();
	gameInProgress = true;
	window.parent.setConnection(2);
	Levels.Run_Script(Game, GAMESTATE.Data.Get().__script);

	var set = false;
	for(var i in data.players.c)
	{
		if(data.players.c[i]==null)
		{
			if(!set)
			{
				Game.Set_Player(i, socket.index, socket.username, true);
				set = true;
			}
			continue;
		}
		Game.Set_Player(i, data.players.c[i], data.players.n[i], false);
	}

	Game.Set_Up(_gamestate_data.turn, _gamestate_data.connected, _gamestate_data.cur_player);
	Game.Set_Passkey(data.passkey);
	Game.Active_Player().Active = true;
	Game.Active_Player().End_Turn();
}
function join_game(data)
{
	let GAME = Map_Reader.String(decrypt_game_data(data.map));

	let sampledGame = new Engine_Class(GAME, true);
	sampledGame.Set_Interface(INTERFACE);
	sampledGame.FORCE_MERGE_DISPLAY = true;
	imageHolderCanvas.clearRect(0, 0, 900, 900);
	worldCanvas.clearRect(0, 0, 900, 900);
	let _game_imgs = INTERFACE.Get_Sample(sampledGame);
	imageHolderCanvas.clearRect(0, 0, 900, 900);
	worldCanvas.clearRect(0, 0, 900, 900);

		///** Create and draw image **//
	let canvas = document.createElement("canvas");
	canvas.width = 600;
	canvas.height = 600;
	let ctx = canvas.getContext("2d");

	Canvas.ScaleImageData(ctx, _game_imgs, 0, 0, 10/sampledGame.Terrain_Map.Width, 10/sampledGame.Terrain_Map.Height);
	sampledGame.End_Game();

	ctx.globalAlpha = 1;
	Shape.Box.Draw(ctx,0,0,600,600,"#73877B");

	let img = document.createElement("img");
	img.src = canvas.toDataURL("image/png");

	changeContent("HOST GAME", [GAME.Name, img.src]);

	init_map(GAME, data.players, data.game);
}

function openMapEditor(game_data, data_index, testing_won){
	INTERFACE.Close_Menu();
	INTERFACE.Set_Controls(document.getElementById("inputHandler"));
	INTERFACE.Allow_Controls(true);
	window.parent.setConnection(1);

	Menu.MapEditor.Open();
	Menu.MapEditor.New(data_index, game_data, testing_won);
	INTERFACE.Display_Menu(Menu.MapEditor);
}

function changeContent(choice, title, dontAsk)
{
	if(INTERFACE==null)return;
	if(!dontAsk)
	if(INTERFACE.Game!=null && choice!="GAME PLAY")
	{
		let ans = confirm("This will exit the game. Are you sure?");
		if(!ans)return;
		INTERFACE.Game.Quit_Game();
		INTERFACE.setGame(null);
	}
	if(choice!="GAME PLAY")
	{
		currently_playing = false;
	}

	document.getElementById("LOADINGOVERLAY").style.display = "none";
	document.getElementById("GAMECONTENT").style.display = "none";
	document.getElementById("MAPSELECTION").style.display = "none";
	document.getElementById("CONTACT").style.display = "none";
	document.getElementById("GAMELOBBY").style.display = "none";
	document.getElementById("HOSTNEWGAME").style.display = "none";
	document.getElementById("ENDGAME").style.display = "none";
	window.parent.document.getElementById("container").style.maxWidth = "";
	window.parent.document.getElementById("container").style.maxHeight = "";
	window.parent.closeChat();
	window.scrollTo(0, 0);

	switch (choice) {
		case "MULTIPLAYER":
			document.getElementById("MAPSELECTION").style.display = "block";
			document.getElementById("CONTENT_TITLE").innerHTML = "Multiplayer";
			INTERFACE.Open_Level_Select();
			break;
		case "STORY":
			document.getElementById("MAPSELECTION").style.display = "block";
			document.getElementById("CONTENT_TITLE").innerHTML = "Story";
			INTERFACE.Open_Story();
			break;
		case "GAME PLAY":
			document.getElementById("GAMECONTENT").style.display = "block";
			document.getElementById("CONTENT_TITLE").innerHTML = title;
			window.parent.document.getElementById("container").style.maxWidth = "810px";
			window.parent.document.getElementById("container").style.maxHeight = "665px";

				// remove
			document.getElementById("gameHelpers").style.display = "block";
			document.getElementById("canvasHolder").style.top = "84px";
			break;
		case "GAME LOBBY":
			document.getElementById("GAMELOBBY").style.display = "block";
			document.getElementById("CONTENT_TITLE").innerHTML = "Online Lobby";
			break;
		case "HOST GAME":
			document.getElementById("HOSTNEWGAME").style.display = "block";
			document.getElementById("CONTENT_TITLE").innerHTML = title[0];
			document.getElementById("HOSTGAMEIMG").src = title[1];
			break;
		case "END GAME":
			document.getElementById("ENDGAME").style.display = "block";
			document.getElementById("CONTENT_TITLE").innerHTML = title;

			window.parent.refresh_lobby();
			window.parent.refreshChat();
			INTERFACE.setGame(null);
			break;
		case "MAP EDITOR":
			document.getElementById("GAMECONTENT").style.display = "block";
			document.getElementById("CONTENT_TITLE").innerHTML = "Map Editor";
			openMapEditor();

				// remove
			document.getElementById("gameHelpers").style.display = "none";
			document.getElementById("canvasHolder").style.top = "0px";
			break;
		case "CONTACT US":
			document.getElementById("CONTACT").style.display = "block";
			document.getElementById("CONTENT_TITLE").innerHTML = "Contact Us";
			break;
	}
}

var CONTENT_REDIRECT = "MULTIPLAYER";
function chooseContent(args){
	CONTENT_REDIRECT = args;
}
function mainMenu(){
	currently_playing = false;
	Canvas.Stop_All();
	Animations.Remove_All();
	Canvas.Run_Next_Tick(function(){
		for(var i in Canvas.Contexts)
		{
			var ctx = Canvas.Contexts[i];
			ctx.clearRect(0, 0, ctx.width, ctx.height);
		}
	});
	INTERFACE.Close_Menu();
	if(MUSIC!=Music.Retrieve("intro"))
	{
		Music.Stop_All();
		MUSIC = Music.Retrieve("intro").Play();
	}

	window.parent.openLobby();
}

var paused = false;

var _____danger = [];

function pause(){
	if(paused){
		paused = false;
		document.getElementById("pause").innerHTML = "<pause></pause>";
	}else{
		paused = true;
		document.getElementById("pause").innerHTML = "<play></play>";
	}
}

function view_danger(){
	if(!INTERFACE.Check_Controls())return;
	if(_____danger.length>0){
		INTERFACE.UNHIGHLIGHT(_____danger);
		_____danger = [];
		INTERFACE.Draw();
	}else{
		_____danger = INTERFACE.HIGHLIGHT();
		INTERFACE.Draw();
	}
}

function displaySpeed(e){
	if(!speedAdjustmentUp){
		speedAdjustmentUp = true;
		displayNext(e);
	}
	else{
		speedAdjustmentUp = false;
		do{
			e = e.nextSibling;
		}while(e&&e.nodeType!=1);
		e.style.display = "none";
	}
}

function getElementsByClass(searchClass,tag,node){
	if(tag==null)
		tag = "*";
	if(node==null)
		node = document;
	var classElements = new Array();
	var els = node.getElementsByTagName(tag);
	var elsLen = els.length;
	var pattern = new RegExp("(^|\\s)"+searchClass+"(\\s|$)");
	for(i=0,j=0;i<elsLen;i++){
		if(pattern.test(els[i].className)){
			classElements[j] = els[i];
			j++;
		}
	}
	return classElements;
}

function sfxToggle(button){
	if(SFXs.Mute(Music.Mute())){
		button.innerHTML = "Sound Off";
	}
	else{
		button.innerHTML = "Sound On";
		MUSIC.Play();
	}
}

function displayNext(id_to_show){
	var elements = getElementsByClass("btn_super","div");
	for(var i=0;i<elements.length;i++)
	{
		elements[i].style.display = "none";
	}
	id_to_show = id_to_show.substring(id_to_show.indexOf("->")+2,id_to_show.length);
	document.getElementById(id_to_show).style.display = "block";
	document.getElementById("gameLogo").style.visibility = "hidden";
}
function backNav(x){
	x.style.display = "none";
	var elements = getElementsByClass("btn_super","div");
	for(var i=0;i<elements.length;i++)
	{
		elements[i].style.display = "block";
	}
	document.getElementById("gameLogo").style.visibility = "visible";
}
