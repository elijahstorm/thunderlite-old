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
	list:[],
	indexer:0,
	display:function(){
		if(!logCanvas)return;
		logCanvas.clearRect(0, 0, Canvas.Width, Canvas.Height);
		var level = 10;
		for(var i in this.list)
		{
			let size = Math.max((Canvas.Width/2)-(window.parent.mobilecheck() ? 100 : 400), TILESIZE*3)+30;
			height = 15*Math.ceil(this.list[i].msg.length/(size/16))+10;
			Shape.Rectangle.Draw(logCanvas, 10, level, size, height, this.list[i].boxColor);
			Shape.Box.Draw(logCanvas, 10, level, size, height, "#FFF");
			this.list[i].txt.Draw(logCanvas, 15, level+3, size, height, this.list[i].msg);
			level+=height+10;
		}
	},
	add:function(msg, color, time, callback){
		if(time==null)time = 10000;
		if(this.list.length==0)
		{
			this.indexer = 0;
		}
		if(color==null)color = "#fff";
		this.list.push({
			txt:new Text_Class("15pt Arial", color),
			boxColor: parseInt(color.charAt(1), 16)<=7 ? "#5B2838" : "#768280",
			msg:msg,
			index:this.indexer
		});
		this.display();
		var i = this.indexer;
		setTimeout(function(){
			LOG.remove(i);
			if(callback!=null)callback();
		},time);
		return this.indexer++;
	},
	clear:function(){
		this.list = [];
		this.display();
	},
	remove:function(index){
		for(var i in this.list)
		{
			if(this.list[i].index==index)
			{
				this.list.splice(i, 1);
			}
		}
		this.display();
	}
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
	Point:function(Game, x, y)
	{
		let terrain = Game.Terrain_Map.At(x, y);
		if(terrain.pointer!=null)return;

		let ani = Animations.Retrieve("Pointer Animation");
		let d = ani.New(HUD_Display.Context,
			x*TILESIZE-INTERFACE.X_Offset(),
			y*TILESIZE-INTERFACE.Y_Offset(), ani.Width*TILESIZE/60, ani.Height*TILESIZE/60, true);
		ani.Stop = false;
		terrain.pointer = d;
	},
	Unpoint:function(Game, x, y)
	{
		let terrain = Game.Terrain_Map.At(x, y);
		if(terrain.pointer==null)return;

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
	}
};

var online = false;
var socket;
window.onload = function(){
	if(window.parent)socket = window.parent.socket;
	if(socket)online = true;

	document.getElementById("gameLogo").src = "img/Logo "+(window.parent.mobilecheck() ? "Mobile" : "Desktop")+".png";

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
	Menu.LevelSelect.Set_Scroller(function(){
		let g_list = new Array();
		let list_painter = function(x, y, left, top, w, h, zoom)
		{
			if(g_list[y][x]==null)return;
			g_list[y][x].Y.Set(top+draw_top);
			if(top<0)
			{
				g_list[y][x].Alpha.Set(1+(top/draw_height));
				return;
			}
			if(top>450)
			{
				g_list[y][x].Alpha.Set(1-((top%draw_height)/draw_height));
				return;
			}
			g_list[y][x].Alpha.Set(1);
		};

		let g_list_display = new Tiling;
		g_list_display.setup(600, 5*draw_height, 3*draw_width, Math.max(Math.max(ground_index, air_index), sea_index)*draw_height, draw_width, draw_height);

		let g_list_scroller = new Scroller(function(left, top, zoom)
		{
			top/=TILESIZE;
			top*=draw_height;
			g_list_display.render(left, top, zoom, list_painter);
		}, {
			locking:false,
			zooming:false
		});

		g_list_scroller.setDimensions(draw_width, 80, 4, (Math.max(Math.max(ground_index, air_index), sea_index)-5)*TILESIZE);

		scroller = g_list_scroller;
	});
	socket.emit('gamedata get', {mapowner:'freemaps'}, 0, 5);
	socket.emit('userdata get', "progress");

	if(window.parent.mobilecheck())
	{
		document.getElementById("avatarCanvas").style.height = 200+"px";
		document.getElementById("avatarCanvas").style.width = 60+"px";
		avatarCanvas = initiateCanvas("avatarCanvas");
		avatarCanvas.width = 60;
		avatarCanvas.height = 200;
		document.getElementById("statsCanvas").style.width = 600+"px";
		statsCanvas = initiateCanvas("statsCanvas");
		statsCanvas.width = 600;
		statsCanvas.height = 60;
	}
	else
	{
		document.getElementById("avatarCanvas").style.height = 600+"px";
		document.getElementById("avatarCanvas").style.width = 210+"px";
		avatarCanvas = initiateCanvas("avatarCanvas");
		avatarCanvas.width = 210;
		avatarCanvas.height = 600;
		document.getElementById("statsCanvas").style.width = 600+"px";
		statsCanvas = initiateCanvas("statsCanvas");
		statsCanvas.width = 600;
		statsCanvas.height = 70;
	}
	Avatar_Display = Canvas.Create_Canvas(avatarCanvas, "avatar");
	Avatar_Display.Background.State.Set("#55D6C2");
	Avatar_Display.Background.Alpha.Set(1);
	Stats_Display = Canvas.Create_Canvas(statsCanvas, "stat");
	Stats_Display.Background.State.Set("#F49097");
	Stats_Display.Background.Alpha.Set(1);

	INTERFACE = new Interface_Class;
	dialogCanvas = initiateCanvas("dialogCanvas");
	Dialog_Display = Canvas.Create_Canvas(dialogCanvas, "dialog");

	Dialog = new Dialog_Class(dialogCanvas);
	for(var i in onInterfaceLoadedList){
		onInterfaceLoadedList[i](INTERFACE);
	}
	onInterfaceLoadedList = null;
	document.getElementById('overlay').style.display = 'none';
	document.getElementById("menuButton").onclick = function(){
		if(!confirm("Are you sure?\nYou will lose all current progress"))
			return;
		INTERFACE.Game.Send_Move('leave');
		INTERFACE.Game.End_Game();
	};
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

function init_map(map, players, game_id, skip_pregame, offline_game){
	document.getElementById("mainMenu").style.display="none";
	var Game = new Engine_Class(map);
	if(offline_game!=null)
	if(offline_game[0])
	{
		Game.game_data[0] = true;
		Game.game_data[2] = offline_game[1];
		if(offline_game[2]==1)
			Game.game_data[3] = 1;
		else if(offline_game[2]==2)
			Game.game_data[3] = 2;
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

	Game.FORCE_MERGE_DISPLAY = true;
	Menu.PreGame.Map(map, INTERFACE.Get_Sample(Game));
	Game.FORCE_MERGE_DISPLAY = false;
	if(players!=null)
	{
		for(var i in players.c)
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
		Menu.PreGame.AddStarter();
	}
	INTERFACE.Display_Menu(Menu.PreGame);
}
function new_custom_game(game_data, name, skippingLobby, save_data_index, story_progress)
{
	if(!name)return;

	let data;
	if(game_data.Valid)
		data = game_data;
	else data = Map_Reader.Read(game_data);
	if(!data.Valid)return;

	init_map(data, null, null, skippingLobby, [skippingLobby, save_data_index, story_progress]);
	if(skippingLobby)return;

	if(online){
		socket.emit("open", data.id, name, data.Player_Amount());
		window.parent.lobby.contentWindow.add_game(name,data.Map,data.id,true);
		window.parent.lobby.contentWindow._openGames.add();
	}
}
function load_game(gameData){
	document.getElementById("mainMenu").style.display="none";
	var Game = new Engine_Class(gameData);
	if(!Game.valid)return;
	INTERFACE.Close_Menu();
	INTERFACE.setGame(Game);
	INTERFACE.Set_Controls(document.getElementById("inputHandler"));
	INTERFACE.Allow_Controls(true);
	Canvas.Set_Game(Game);
	Canvas.Redraw();
	Canvas.Start_All();
	gameInProgress = true;
	Game.Start();
}

function openLevelSelect(){
	INTERFACE.Open_Level_Select();
}
function openStory(){
	INTERFACE.Open_Story();
}
function openMapEditor(game_data, data_index, testing_won){
	document.getElementById("mainMenu").style.display="none";
	INTERFACE.Close_Menu();
	INTERFACE.Set_Controls(document.getElementById("inputHandler"));
	INTERFACE.Allow_Controls(true);
	window.parent.setConnection(1);

	Menu.MapEditor.Open();
	Menu.MapEditor.New(data_index, game_data, testing_won);
	INTERFACE.Display_Menu(Menu.MapEditor);
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
		backCanvas.fillStyle = "#77a8bc";
		backCanvas.fillRect(0,0,Canvas.Width,Canvas.Height);
	});
	INTERFACE.Close_Menu();
	if(MUSIC!=Music.Retrieve("intro"))
	{
		Music.Stop_All();
		MUSIC = Music.Retrieve("intro").Play();
	}

	document.getElementById("mainMenu").style.display="block";
	window.parent.openLobby();
	var elements = getElementsByClass("btn_super","div");
	for(var i=0;i<elements.length;i++)
	{
		elements[i].style.display = "block";
	}
	elements = getElementsByClass("sub_menu","div");
	for(var i=0;i<elements.length;i++)
	{
		elements[i].style.display = "none";
	}
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
