/// Code written and created by Elijah Storm
// Copywrite April 5, 2020
// for use only in ThunderLite Project


var Interface_Class = function()
{
	this.IS_MOBILE_GAME = window.parent.mobilecheck();
	var allow_input = false;
	var self = this;
	var game,terrain_disp;
	var clientWidth=0,clientHeight=0;
	var gameWidth=0,gameHeight=0;
	var pallet = {
		border:"#353214",
		inside:"#606066",
		title:"#F2F5FF",
		text:"#919399",
		validBG:"#F5E960",
		invalidBG:"#B7B48F",
		bad:"#F44450"
	};

	this.Width = function()
	{
		return gameWidth;
	};
	this.Height = function()
	{
		return gameHeight;
	};

	self.setGame = function(g)
	{
		game = g;
		self.Game = g;

		if(g==null)return 1;
		if(g.Terrain_Map==null)return 1;

		let __X = g.Terrain_Map.Width,
			__Y = g.Terrain_Map.Height;

		if(g==null){
			self.Tiles = null;
			terrain_disp = null;
			return 2;
		}
		game.Set_Interface(self);
		self.Tiles = new Tile_Holder(__X, __Y, function(ui, x, y){
			if(ui.Check_Controls())ui.Select_Tile(x, y);
		});
		self.Tiles.Interface = self;
		terrain_disp = new Tiling;
		terrain_disp.setup(600, 600, game.Terrain_Map.Width*TILESIZE, game.Terrain_Map.Height*TILESIZE, TILESIZE, TILESIZE);
		return 0;
	};
	// self.Slide_Up = HUD_Display.Add_Drawable(Shape.Rectangle, "up", 100, 0, 400, 20, "#FF0", Canvas.Clear, 0);
	// self.Slide_Down = HUD_Display.Add_Drawable(Shape.Rectangle, "down", 100, 580, 400, 20, "#FF0", Canvas.Clear, 0);
	// self.Slide_Left = HUD_Display.Add_Drawable(Shape.Rectangle, "left", 0, 100, 20, 400, "#FF0", Canvas.Clear, 0);
	// self.Slide_Right = HUD_Display.Add_Drawable(Shape.Rectangle, "right", 580, 100, 20, 400, "#FF0", Canvas.Clear, 0);
	function overSliders(x,y)
	{
		// if(Canvas.overlappingDrawable(self.Slide_Up,x,y))return 0;
		// if(Canvas.overlappingDrawable(self.Slide_Down,x,(y*self.gameYScale+(TILESIZE*10-gameHeight))))return 1;
		// if(Canvas.overlappingDrawable(self.Slide_Left,x,y))return 2;
		// if(Canvas.overlappingDrawable(self.Slide_Right,(x*self.gameXScale+(TILESIZE*10-gameWidth)),y))return 3;
		return -1;
	}
	var hovered_dir = [false,false,false,false];

	/** display */
	self.isTileOnScreen = function(_x, _y)
	{
		var _values = scroller.getValues();

		var FarLeftTile = Math.ceil(_values.left/TILESIZE)+1;
		var FarRightTile = Math.floor((_values.left+gameWidth)/TILESIZE)-1;
		var TopTile = Math.ceil(_values.top/TILESIZE)+1;
		var BottomTile = Math.floor((_values.top+gameHeight)/TILESIZE)-1;

		if(_x<FarLeftTile)
		if(_y<TopTile)
			return 5; // top left
		if(_x<FarLeftTile)
		if(_y>BottomTile)
			return 6; // bottom left
		if(_x>FarRightTile)
		if(_y>BottomTile)
			return 7; // bottom right
		if(_x>FarRightTile)
		if(_y<TopTile)
			return 8; // top right
		if(_x<FarLeftTile)
			return 1; // just left
		if(_x>FarRightTile)
			return 2; // just right
		if(_y<TopTile)
			return 3; // just top
		if(_y>BottomTile)
			return 4; // just bottom
		return 0; // just right
	};
	self.Scroll_To_Tile = function(_x, _y)
	{
		var direction = self.isTileOnScreen(_x, _y);
		if(direction==1)
			scroller.scrollTo((_x-1)*TILESIZE, scroller.getValues().top, true);
		else if(direction==2)
			scroller.scrollTo((_x+1)*TILESIZE, scroller.getValues().top, true);
		else if(direction==3)
			scroller.scrollTo(scroller.getValues().left, (_y-1)*TILESIZE, true);
		else if(direction==4)
			scroller.scrollTo(scroller.getValues().left, (_y+1)*TILESIZE, true);
		else if(direction==5)
			scroller.scrollTo((_x-1)*TILESIZE-1, (_y-1)*TILESIZE, true);
		else if(direction==6)
			scroller.scrollTo((_x-1)*TILESIZE-1, (_y+1)*TILESIZE, true);
		else if(direction==7)
			scroller.scrollTo((_x+1)*TILESIZE+1, (_y-1)*TILESIZE, true);
		else if(direction==8)
			scroller.scrollTo((_x+1)*TILESIZE+1, (_y+1)*TILESIZE, true);
	};
	self.X_Offset = function()
	{
		return scroller.getValues().left;
	};
	self.Y_Offset = function()
	{
		return scroller.getValues().top;
	};

	self.Outside_Map = 3; // how many tiles are generated to border outside of the defined map tiles
	function paintOffMap(mapX, mapY, drawX, drawY){
		var outside = self.Outside_Map;
		var at = game.Paint_Off_Map[mapX][mapY];
		var zoomedTile = TILESIZE;
		var left = null; // true if overflow, false if overflow in opposite direction
		var overlay = "rgba(0, 0, 0, 0.45)";

		let paintOffWidth = gameWidth;
		let paintOffHeight = gameHeight;

			// paint left
		if(mapX==0&&drawX>0){
			for(var lastDrawLeft=drawX,i=1;lastDrawLeft>0;i++,lastDrawLeft-=zoomedTile){
				at = game.Paint_Off_Map[mapX+self.Outside_Map-Math.min(i, outside)][mapY];
				at.UI_Draw(worldCanvas, lastDrawLeft-zoomedTile, drawY, true);
				worldCanvas.fillStyle = overlay;
				worldCanvas.fillRect(lastDrawLeft-zoomedTile, drawY, zoomedTile, zoomedTile);
			}
			left = true;
		}

			// paint right
		else if(mapX+1==game.Terrain_Map.Width&&drawX+zoomedTile<paintOffWidth){
			for(var lastDrawLeft=drawX+zoomedTile,i=1;lastDrawLeft<paintOffWidth;i++,lastDrawLeft+=zoomedTile){
				at = game.Paint_Off_Map[mapX+self.Outside_Map+Math.min(i, outside)][mapY];
				at.UI_Draw(worldCanvas, lastDrawLeft, drawY, true);
				worldCanvas.fillStyle = overlay;
				worldCanvas.fillRect(lastDrawLeft, drawY, zoomedTile, zoomedTile);
			}
			left = false;
		}

			// paint up
		if(mapY==0&&drawY>0){
			for(var lastDrawTop=drawY,i=1;lastDrawTop>0;i++,lastDrawTop-=zoomedTile){
				at = game.Paint_Off_Map[mapX][mapY+self.Outside_Map-Math.min(i, outside)];
				at.UI_Draw(worldCanvas, drawX, lastDrawTop-zoomedTile, true);
				worldCanvas.fillStyle = overlay;
				worldCanvas.fillRect(drawX, lastDrawTop-zoomedTile, zoomedTile, zoomedTile);
				if(left==null)continue;
				if(left){
					for(var lastDrawLeft=drawX,j=1;lastDrawLeft>0;j++,lastDrawLeft-=zoomedTile){
						at = game.Paint_Off_Map[mapX+self.Outside_Map-Math.min(j, outside)][mapY+self.Outside_Map-Math.min(i, outside)];
						at.UI_Draw(worldCanvas, lastDrawLeft-zoomedTile, lastDrawTop-zoomedTile, true);
						worldCanvas.fillStyle = overlay;
						worldCanvas.fillRect(lastDrawLeft-zoomedTile, lastDrawTop-zoomedTile, zoomedTile, zoomedTile);
					}
				}else{
					for(var lastDrawLeft=drawX+zoomedTile,j=1;lastDrawLeft<gameWidth;j++,lastDrawLeft+=zoomedTile){
						at = game.Paint_Off_Map[mapX+self.Outside_Map+Math.min(j, outside)][mapY+self.Outside_Map-Math.min(i, outside)];
						at.UI_Draw(worldCanvas, lastDrawLeft, lastDrawTop-zoomedTile, true);
						worldCanvas.fillStyle = overlay;
						worldCanvas.fillRect(lastDrawLeft, lastDrawTop-zoomedTile, zoomedTile, zoomedTile);
					}
				}
			}
		}

			// paint down
		else if(mapY+1==game.Terrain_Map.Height&&drawY+zoomedTile<paintOffHeight){
			for(var lastDrawTop=drawY+zoomedTile,i=1;lastDrawTop<paintOffHeight;i++,lastDrawTop+=zoomedTile){
				at = game.Paint_Off_Map[mapX][mapY+self.Outside_Map+Math.min(i, outside)];
				at.UI_Draw(worldCanvas, drawX, lastDrawTop, true);
				worldCanvas.fillStyle = overlay;
				worldCanvas.fillRect(drawX, lastDrawTop, zoomedTile, zoomedTile);
				if(left==null)continue;
				if(left){
					for(var lastDrawLeft=drawX,j=1;lastDrawLeft>0;j++,lastDrawLeft-=zoomedTile){
						at = game.Paint_Off_Map[mapX+self.Outside_Map-Math.min(j, outside)][mapY+self.Outside_Map+Math.min(i, outside)];
						at.UI_Draw(worldCanvas, lastDrawLeft-zoomedTile, lastDrawTop, true);
						worldCanvas.fillStyle = overlay;
						worldCanvas.fillRect(lastDrawLeft-zoomedTile, lastDrawTop, zoomedTile, zoomedTile);
					}
				}else{
					for(var lastDrawLeft=drawX+zoomedTile,j=1;lastDrawLeft<gameWidth;j++,lastDrawLeft+=zoomedTile){
						at = game.Paint_Off_Map[mapX+self.Outside_Map+Math.min(j, outside)][mapY+self.Outside_Map+Math.min(i, outside)];
						at.UI_Draw(worldCanvas, lastDrawLeft, lastDrawTop, true);
						worldCanvas.fillStyle = overlay;
						worldCanvas.fillRect(lastDrawLeft, lastDrawTop, zoomedTile, zoomedTile);
					}
				}
			}
		}
	}

	var paint = function(x, y, left, top, w, h, zoom){
		if(game==null)return;
		/// y and x are flipped when called from scroller, due to nature of canvas data

		var at = game.Terrain_Map.At(y,x);
		if(at==null)return;

		at.UI_Draw(terrainCanvas, left, top);
		paintOffMap(y,x,left,top);

		if(at.Hidden)
		{
			at = at.Building;
			if(at!=null)at.UI_Draw(buildingCanvas, left, top);
			at = self.Tiles.At(y,x);
			if(at!=null)at.Draw(tileCanvas, left, top, w, h);
			return;
		}

		at = at.Building;
		if(at!=null)at.UI_Draw(buildingCanvas, left, top);
		at = game.Units_Map.At(y,x);
		if(at!=null&&at!=moving_unit)at.UI_Draw(charCanvas, left, top);
		at = self.Tiles.At(y,x);
		if(at!=null)at.Draw(tileCanvas, left, top, w, h);
	};
	var simplePaint = function(x, y, left, top, w, h, zoom){
		if(game==null)return;

		at = game.Units_Map.At(y,x);
		if(at!=null)
		if(at==moving_unit)
		if(!game.Terrain_Map.At(at.X,at.Y).Hidden || game.Client_Player()==at.Player)
			at.UI_Draw(moveUnitCanvas, left, top);
	};
	let allow_render = true;
	var render = function(left, top, zoom, simple){
		if(game==null)return;

		zoom = 1;

		left = Math.round(left);
		top = Math.round(top);

		overlayCanvas.clearRect(0,0,600,600);
		// hide offscreen active display
		game.Hide_Animations();
		if(simple)
		{
			moveUnitCanvas.clearRect(0,0,600,600);
			if(moving_unit==null)return;
			terrain_disp.render(left, top, zoom, simplePaint);
			return;
		}
		if(clearMoveCanvas)
		{
			clearMoveCanvas = false;
			moveUnitCanvas.clearRect(0,0,900,900);
		}

		if(!allow_render)return;
		self.zoom = zoom;
		backCanvas.fillStyle = "#000";
		seaCanvas.fillStyle = "#3C6BBE";
		backCanvas.fillRect(0,0, 810, 665);
		seaCanvas.fillRect(0,0,600,600);
		worldCanvas.clearRect(0,0,600,600);
		devCanvas.clearRect(0,0,600,600);
		hudCanvas.clearRect(0,0,600,600);
		tileCanvas.clearRect(0,0,600,600);
		uiCanvas.clearRect(0,0,600,600);
		terrainCanvas.clearRect(0,0,600,600);
		buildingCanvas.clearRect(0,0,600,600);
		charCanvas.clearRect(0,0,600,600);
		// weatherCanvas.clearRect(0,0,600,600);

			// hide offscreen terrain animations, if shown then it will unhide them in Draw fnc
		game.Hide_Terrain_Anis();
		terrain_disp.render(left, top, zoom, paint);
		Animations.Tick();
	};

			// view_danger();
	let Avatar,Status;
	Avatar = {
		List_Sliders:[],
		Player_List:function(__player) {
			if(game==null)return;
			HUD_Avoid_Mouse.show();
			if(__player==null)
			{
				for (var i = 0; i < Avatar.List_Sliders.length; i++) {
					Avatar.List_Sliders[i].style.left = (100*i+200)+"px";
				}
				return;
			}
			document.getElementById('day_turn_info').innerHTML = "Day "+(game.Turn()+1);
			document.getElementById('avatar-icon').src = __player.Icon.Source();

			while (game.Player(parseInt(Avatar.List_Sliders[0].id.charAt(Avatar.List_Sliders[0].id.length-1)))!=__player) {
				Avatar.List_Sliders[0].remove();
				document.getElementById("active-player-list").appendChild(Avatar.List_Sliders[0]);
				Avatar.List_Sliders.push(Avatar.List_Sliders.shift());
			}

			for (var i = 0; i < Avatar.List_Sliders.length; i++) {
				Avatar.List_Sliders[i].style.left = "0px";
				if(game.Player(i).Dead)
				{
					document.getElementById("active-player-money"+i).innerHTML = "";
					document.getElementById("active-player-status"+i).innerHTML = "DEAD";
					continue;
				}
				if(game.Player(i).Cash_Money()!=0)
					document.getElementById("active-player-money"+i).innerHTML = "$"+game.Player(i).Cash_Money();
				else document.getElementById("active-player-money"+i).innerHTML = "";
				let _standingStr = "⭐",
					_standing = game.Check_Player_Standing(i);
				for (var jj = 0; jj < _standing; jj++) {
					_standingStr+="⭐";
				}
				document.getElementById("active-player-status"+i).innerHTML = _standingStr;
			}
		},
		Weather:function(_weather) {
			document.getElementById('weather-icon').src = _weather.Icon.Source();
		},
		Clear:function(){
			let list = document.getElementById("active-player-list");
			for (var i = 0; i < list.childNodes.length; ) {
				list.childNodes[i].remove();
			}
		},
		Set_Up:function(__players) {
			Avatar.List_Sliders = [];
			let el,txt,money,status;
			let parentList = document.getElementById("active-player-list");
			// document.getElementById('avatarCanvas').style.height =  ?  : "400px";
			for (var i = 0; i < parentList.childNodes.length;) {
				parentList.childNodes[0].remove();
			}
			function makeList(i)
			{
				el = document.createElement("li");
				el.className = "active-game-players";
				txt = document.createElement("h3");
				txt.style.textAlign = "left";
				txt.style.padding = "0px 5px";
				txt.style.margin = "0px";
				txt.innerHTML = game.Player(i).Name;
				money = document.createElement("h6");
				if(game.Player(i).Cash_Money()!=0)
					money.innerHTML = game.Player(i).Cash_Money();
				money.id = "active-player-money"+i;
				money.style.margin = "0px";
				status = document.createElement('h6');
				status.id = "active-player-status"+i;
				status.style.margin = "0px";
				let _standingStr = "⭐",
					_standing = game.Check_Player_Standing(i);
				for (var jj = 0; jj < _standing; jj++) {
					_standingStr+="⭐";
				}
				status.innerHTML = _standingStr;
				el.appendChild(txt);
				el.appendChild(money);
				el.appendChild(status);
				el.id = "player "+i;
				el.style.background = data_to_hex(Team_Colors.Color[game.Player(i).Color][0])+"77";
				parentList.appendChild(el);
				el.Player = game.Player(i);
				Avatar.List_Sliders.push(el);
			}
			makeList(__players-1);
			for(let i=0;i<__players-1;i++)
			{
				makeList(i);
			}
		}
	};
	this.Avatar = Avatar;
	Status = {
		Show_Info:function(__tile) {
			if(__tile==null)
			{
				document.getElementById('statsCanvas').style.visibility = "hidden";
				Status.Info_Type = 0;
				return;
			}

			document.getElementById('statsCanvas').style.visibility = "visible";

			document.getElementById('status-icon').src = __tile.Sprite().Source();
			document.getElementById('status-info').innerHTML = __tile.Description();

			Status.Info_Type = __tile.SELECTABLE;
		},
		Info_Type:0
	};
	this.Status = Status;

	var Screen = {
		// Border:Dialog_Display.Add_Drawable(Shape.Box, "Border", 0, 0, 600, 600, "#0ff", Canvas.Background),
		openDrawables:[],
		openButtons:[],
		Hide_Unit_List:function()
		{
			self.inputXScale = 1;
			self.inputYScale = 1;
			var count = 0;
			for(var i in Screen.openDrawables)
			{
				count++;
				Dialog_Display.Delete_Drawable(Screen.openDrawables[i]);
			}
			Screen.openDrawables = [];
			count = 0;
			for(var i in Screen.openButtons)
			{
				count++;
				clickable.Delete_Button(Screen.openButtons[i]);
			}
			Screen.openButtons = [];
			Dialog_Display.Clear();
			self.Select_Tile();
		},
		Next_Player:function(player,callback)
		{
			if(player.Game.Game_Over)return;
			// allow_render = false;
			var collectiveDrawable = Dialog_Display.Add_Drawable({
				back:Shape.Rectangle,
				border:Shape.Box,
				icon:player.Icon,
				name:new Text_Class("25pt Arial", "#000"),
				Draw:function(c, x, y, w, h, s){
					if(c.globalAlpha==1)return;
					try {
						this.back.Draw(c,x,y,w,h,"#DDCA7D");
						c.lineWidth = 10;
						this.border.Draw(c,x+5,y+5,w-10,h-10,data_to_hex(Team_Colors.Color[player.Color][2]));
						c.lineWidth = 1;
						this.icon.Draw(c,x+20,y+20,100,100);
						if(self.IS_MOBILE_GAME)
							this.name.Draw(c,x+30,y+150,w,h,player.Name);
						else this.name.Draw(c,x+180,y+40,w,h,player.Name);
					} catch (e) {
						console.error("ERROR DRAWING CHANGING PLAYER");
					}
				}
			}, null, 600, 100, self.IS_MOBILE_GAME ? 200 : 350, 250, null, null, .7);
			Core.Slide_Drawable_X(collectiveDrawable, -550, 10, function(collectiveDrawable){
				setTimeout(function(){
					Core.Fade_Drawable(collectiveDrawable, 0, 10, function(collectiveDrawable){
						Dialog_Display.Delete_Drawable(collectiveDrawable);
						// allow_render = true;
						callback();
					});
				}, 1000);
			});
		}
	};

	let open_menu = null;
	this.Display_Menu = function(menu, no_scale)
	{
		if(open_menu)return;
		menuCanvas.clearRect(0,0,900,900);
		open_menu = menu;
		menu_scale = (no_scale==true) ? false : true;
		if(menu_scale)
			menu.Scale((gameWidth-210)/600, (gameHeight-65)/600);
		else menu.Scale(1, 1);
		self.Click = menu.Click;
		self.Release = menu.Release;
		self.Right_Click = menu.Right_Click;
		self.Mouse_Move = menu.Mouse_Move;
	};
	this.Close_Menu = function()
	{
		if(!open_menu)return;
		open_menu.Close();
		open_menu = null;
		self.Click = click_fnc;
		self.Release = release_fnc;
		self.Right_Click = r_click_fnc;
		self.Mouse_Move = m_move_fnc;
		if(menuCloser!=null)
			menuCloser();
	};
	this.Open_Menu = function()
	{
		return open_menu;
	};

	/** input */
	self.gameXScale = 1;
	self.gameYScale = 1;
	self.inputXScale = 1;
	self.inputYScale = 1;
	self.zoom = 1;
	var clickPos=-1;
	var mousedown = false;
	var in_hl_path = false;
	var touch_start_loc = new Array(2);
	var last_handler = null;
	var curPinchDiff = 0,
		prevPinchDiff = 0;

		//** Add the game event handler interactions */
	let current_interactions = new Array(8);
	const ___touchstart = function(e){
		HUD_Avoid_Mouse.interact();
		e.preventDefault();

		var x = Math.round(e.touches[0].pageX);
		var y = Math.round(e.touches[0].pageY);

		y-=85; // this is a temp fix for a mobile bug
		if(clientWidth>600)
			x-=Math.floor((clientWidth-600)/2);

		self.Click(x,y);
		touch_start_loc[0] = x;
		touch_start_loc[1] = y;
		scroller.doTouchStart(e.touches, e.timeStamp);
		mousedown = true;
		in_hl_path = false;

		setTimeout(function(){
			if(!mousedown)return false;

			in_hl_path = true;
			self.Release(x,y);
			scroller.doTouchEnd(e.timeStamp);
		}, 150);

		return false;
	};
	const ___touchmove = function(e){
		e.preventDefault();
		var x = Math.round(e.touches[0].clientX);
		var y = Math.round(e.touches[0].clientY);

		y-=85; // this is a temp fix for a mobile bug
		if(clientWidth>600)
			x-=Math.floor((clientWidth-600)/2);

		// if(e.touches.length==2)
		// {
		// 	scroller.doTouchEnd(e.timeStamp);
		// 	var _x = Math.round(e.touches[1].clientX);
		// 	var _y = Math.round(e.touches[1].clientY);
		// 	curPinchDiff = Math.round(Math.sqrt(Math.pow(x - _x, 2)+Math.pow(y - _y, 2)));
		//
		// 	if(prevPinchDiff!=0)
		// 	{
		// 		let _zoom = Math.abs(curPinchDiff/prevPinchDiff);
		// 	}
		//
		// 	prevPinchDiff = curPinchDiff;
		// 	return false;
		// }
		// else prevPinchDiff = 0;

		if(Math.abs(x-touch_start_loc[0])<5 &&
			Math.abs(y-touch_start_loc[1])<5)
			return false;

		touch_start_loc[0] = -1;
		touch_start_loc[1] = -1;
		if(in_hl_path)
		{
			self.Mouse_Move(x,y);
			return false;
		}

		mousedown = false;

		scroller.doTouchMove(e.touches, e.timeStamp, e.scale)

		return false;
	};
	const ___touchend = function(e){
		e.preventDefault();

		if(e.touches.length==0)return;

		var x = Math.round(e.touches[0].clientX);
		var y = Math.round(e.touches[0].clientY);

		y-=85; // this is a temp fix for a mobile bug
		if(clientWidth>600)
			x-=Math.floor((clientWidth-600)/2);

		if(!in_hl_path)
		{
			if(Math.abs(x-touch_start_loc[0])<5 &&
				Math.abs(y-touch_start_loc[1])<5)
				self.Release(x,y);
		}
		scroller.doTouchEnd(e.timeStamp);
		touch_start_loc[0] = -1;
		touch_start_loc[1] = -1;
		mousedown = false;
		in_hl_path = false;

		return false;
	};
	const ___touchcancel = function(e){
		e.preventDefault();

		if(in_hl_path)scroller.doTouchEnd(e.timeStamp);
		touch_start_loc[0] = -1;
		touch_start_loc[1] = -1;
		mousedown = false;
		in_hl_path = false;
	};
	const ___mousedown = function(e){
		try {
			HUD_Avoid_Mouse.interact();

			let x = e.pageX,
				y = e.pageY-85;
			if(clientWidth>600)
				x-=Math.floor((clientWidth-600)/2);

			if(!self.Click(x, y))return;
			if(e.target.tagName.match(/input|textarea|select/i)) {
				return;
			}
			scroller.doTouchStart([{
				pageX: x,
				pageY: y
			}], e.timeStamp);
			mousedown = true;
			return false;
		} catch (e) {

		} finally {
			return false;
		}
	};
	const ___mouseup = function(e){
		try {
			if(e.which==3)return true;
			let x = e.pageX,
				y = e.pageY-85;
			if(clientWidth>600)
				x-=Math.floor((clientWidth-600)/2);
			self.Release(x, y);
			if(!mousedown)return;
			scroller.doTouchEnd(e.timeStamp);
			mousedown = false;
			return false;
		} catch (e) {

		} finally {
			return false;
		}
	};
	const ___contextmenu = function(e){
		e.preventDefault();
		let x = e.pageX,
			y = e.pageY-85;
		if(clientWidth>600)
			x-=Math.floor((clientWidth-600)/2);
		self.Right_Click(x, y);
		return false;
	};
	const ___mousemove = function(e){
		let x = e.pageX,
			y = e.pageY-85;
		if(clientWidth>600)
			x-=Math.floor((clientWidth-600)/2);
		if(!mousedown)
		{
			self.Mouse_Move(x, y);
			return;
		}
		if(selected_unit!=null)
		{
			uiCanvas.clearRect(0,0,900,900);
			selected_unit.Mover.Draw();
		}
		scroller.doTouchMove([{
			pageX: x,
			pageY: y
		}], e.timeStamp);
		return false;
	};
	const set_current_interactions = function(list) {
		for(let i=0;i<8;i++)
		{
			if(list[i]!=null)
				current_interactions[i] = list[i];
		}
	};
	const do_current_interaction = function(index, e) {
		current_interactions[index](e);
	};
	const reset_interations = function(){
		set_current_interactions([
			___touchstart,	___touchmove,	___touchend,		___touchcancel,
			___mousedown,		___mouseup,		___contextmenu,	___mousemove]);
	};
	reset_interations();

	self.Set_Controls = function(handler) {
		if(last_handler!=null)
		{
			return;
			last_handler.removeEventListener("touchstart touchmove touchend touchcancel mousedown mouseup contextmenu mousemove");
			last_handler = null;
		}
		last_handler = handler;
		window.onkeyup = function(e){
			e = e || window.event;
			if (e.keyCode == '38') {
				scroller.scrollBy(0,-TILESIZE,true);
			}
			else if (e.keyCode == '40') {
				scroller.scrollBy(0,+TILESIZE,true);
			}
			else if (e.keyCode == '37') {
				scroller.scrollBy(-TILESIZE,0,true);
			}
			else if (e.keyCode == '39') {
				scroller.scrollBy(+TILESIZE,0,true);
			}
		};
		handler.addEventListener("touchstart", function(e){
			do_current_interaction(0, e);
		});
		handler.addEventListener("touchmove", function(e){
			do_current_interaction(1, e);
		});
		handler.addEventListener("touchend", function(e){
			do_current_interaction(2, e);
		});
		handler.addEventListener("touchcancel", function(e){
			do_current_interaction(3, e);
		});
		handler.addEventListener("mousedown", function(e){
			do_current_interaction(4, e);
		});
		handler.addEventListener("mouseup", function(e){
			do_current_interaction(5, e);
		});
		handler.addEventListener("contextmenu", function(e){
			do_current_interaction(6, e);
		});
		handler.addEventListener("mousemove", function(e){
			do_current_interaction(7, e);
		});
	};
	self.Clickable = {
		Overlay:new Canvas.Drawable("UI Overlay", null, 0, 0, 1000, 1000),
		Button_Class:function(drawable, response, name){
			this.Name = name;
			this.Overlap = function(x, y)
			{
				var X = drawable.X.Get();
				var Y = drawable.Y.Get();
				if(x>=X&&x<X+drawable.Width.Get())
				if(y>=Y&&y<Y+drawable.Height.Get())
					return true;
				return false;
			};
			this.Click = function()
			{
				response(drawable);
			};
			this.Drawable = drawable;
		},
		Buttons:[],
		Add_Button:function(drawable, response, name){
			var btn = new this.Button_Class(drawable, response, name);
			this.Buttons.unshift(btn);
			return btn;
		},
		Delete_Button:function(index){
			var pos = this.Buttons.indexOf(index);
			if(~pos)
			{
				this.Buttons.splice(pos, 1);
				return this.Buttons.length;
			}
			return false;
		},
		Click:function(x, y){
			for(var i in this.Buttons)
			{
				if(this.Buttons[i].Overlap(x, y))
				{
					this.Buttons[i].Click();
					return true;
				}
			}
			return false;
		}
	};
	var clickable = self.Clickable;

	var click_fnc = function(x, y){
		if(!allow_input)return;
		x/=self.inputXScale;
		y/=self.inputYScale;
		if(hovered_dir[0])
		{
			scroller.scrollBy(0,-TILESIZE,true);
			return false;
		}
		if(hovered_dir[1])
		{
			scroller.scrollBy(0,TILESIZE,true);
			return false;
		}
		if(hovered_dir[2])
		{
			scroller.scrollBy(-TILESIZE,0,true);
			return false;
		}
		if(hovered_dir[3])
		{
			scroller.scrollBy(TILESIZE,0,true);
			return false;
		}
		clickPos = [x,y];
		return true;
	};
	var release_fnc = function(x, y){
		if(!allow_input)return;
		x/=self.inputXScale;
		y/=self.inputYScale;
		if(~clickPos)
		if(Math.abs(x-clickPos[0])<10&&Math.abs(y-clickPos[1])<10)
		{
			if(self.Clickable.Click(x, y))return;
			self.Tiles.Click(Math.floor((x+scroller.getValues().left)/TILESIZE),Math.floor((y+scroller.getValues().top)/TILESIZE));
		}
	};
	var r_click_fnc = function(x, y){
		if(!allow_input)return;
		x/=self.inputXScale;
		y/=self.inputYScale;
	};

	let HUD_Avoid_Mouse;
	if(window.parent.mobilecheck())
	{
		let _avatar = document.getElementById('avatarCanvas'),
			_status = document.getElementById('statsCanvas'),
			_helpers = document.getElementById('gameHelpers');
	 	HUD_Avoid_Mouse = {
			avatar_down:true,
			avatar_right:true,
			time_without_interaction:200,
			idle_time:0,
			avoid:20,
			speed:10,
			adjust:-1,
			Switch_X:function(){
				if(HUD_Avoid_Mouse.adjust<0)return;
				if(HUD_Avoid_Mouse.adjust==0)
				{
					if(HUD_Avoid_Mouse.avatar_right)
					{
						_avatar.style.right = null;
						_avatar.style.left = 0;
						HUD_Avoid_Mouse.avatar_right = false;
						HUD_Avoid_Mouse.adjust-=HUD_Avoid_Mouse.speed;
						return;
					}
					_avatar.style.left = null;
					_avatar.style.right = 0;
					HUD_Avoid_Mouse.avatar_right = true;
					HUD_Avoid_Mouse.adjust-=HUD_Avoid_Mouse.speed;
					return;
				}
				if(HUD_Avoid_Mouse.avatar_right)
				{
					if(HUD_Avoid_Mouse.adjust>=_avatar.clientWidth/2)
					{
						_avatar.style.right = (-(_avatar.clientWidth-HUD_Avoid_Mouse.adjust)*2)+"px";
						_avatar.style.left = "";
						if(Math.abs(parseInt(_avatar.style.right))>=_avatar.clientWidth)
						{
							_avatar.style.right = "";
							_avatar.style.left = -_avatar.clientWidth+"px";
						}
					}
					else
					{
						_avatar.style.left = (-(HUD_Avoid_Mouse.adjust*2))+"px";
						_avatar.style.right = "";
					}
				}
				else
				{
					if(HUD_Avoid_Mouse.adjust>=_avatar.clientWidth/2)
					{
						_avatar.style.left = (-(_avatar.clientWidth-HUD_Avoid_Mouse.adjust)*2)+"px";
						_avatar.style.right = "";
						if(Math.abs(parseInt(_avatar.style.left))>=_avatar.clientWidth)
						{
							_avatar.style.left = "";
							_avatar.style.right = -_avatar.clientWidth+"px";
						}
					}
					else
					{
						_avatar.style.right = (-(HUD_Avoid_Mouse.adjust*2))+"px";
						_avatar.style.left = "";
					}
				}

				HUD_Avoid_Mouse.adjust-=HUD_Avoid_Mouse.speed;
			},
			scared:function(x, y){
				_avatar.style.opacity = 0;
				_status.style.opacity = 0;
			},
			show:function(){
				_avatar.style.opacity = 1;
				_status.style.opacity = 1;
				_helpers.style.opacity = 1;
			},
			interact:function(){
				HUD_Avoid_Mouse.idle_time = 0;
				_avatar.style.opacity = 0;
				_status.style.opacity = 1;
				_helpers.style.opacity = .5;
			},
			tick:function(){
				HUD_Avoid_Mouse.Switch_X();
				if(HUD_Avoid_Mouse.idle_time>HUD_Avoid_Mouse.time_without_interaction)
				{
					_avatar.style.opacity = 1;
					_status.style.opacity = 1;
					_helpers.style.opacity = 1;
					return;
				}
				HUD_Avoid_Mouse.idle_time++;
			}
		};
		Canvas.Add_Ticker(HUD_Avoid_Mouse.tick);
	}
	else
	{
		let _avatar = document.getElementById('avatarCanvas'),
			_status = document.getElementById('statsCanvas'),
			_helpers = document.getElementById('gameHelpers');
	 	HUD_Avoid_Mouse = {
			avatar_right:true,
			idle_time:0,
			time_without_interaction:200,
			avoid:20,
			speed:10,
			adjust:-1,
			Switch_X:function(){
				if(HUD_Avoid_Mouse.adjust<0)return;
				if(HUD_Avoid_Mouse.adjust==0)
				{
					if(HUD_Avoid_Mouse.avatar_right)
					{
						_avatar.style.right = null;
						_avatar.style.left = 0;
						HUD_Avoid_Mouse.avatar_right = false;
						HUD_Avoid_Mouse.adjust-=HUD_Avoid_Mouse.speed;
						return;
					}
					_avatar.style.left = null;
					_avatar.style.right = 0;
					HUD_Avoid_Mouse.avatar_right = true;
					HUD_Avoid_Mouse.adjust-=HUD_Avoid_Mouse.speed;
					return;
				}
				if(HUD_Avoid_Mouse.avatar_right)
				{
					if(HUD_Avoid_Mouse.adjust>=_avatar.clientWidth/2)
					{
						_avatar.style.right = (-(_avatar.clientWidth-HUD_Avoid_Mouse.adjust)*2)+"px";
						_avatar.style.left = "";
						if(Math.abs(parseInt(_avatar.style.right))>=_avatar.clientWidth)
						{
							_avatar.style.right = "";
							_avatar.style.left = -_avatar.clientWidth+"px";
						}
					}
					else
					{
						_avatar.style.left = (-(HUD_Avoid_Mouse.adjust*2))+"px";
						_avatar.style.right = "";
					}
				}
				else
				{
					if(HUD_Avoid_Mouse.adjust>=_avatar.clientWidth/2)
					{
						_avatar.style.left = (-(_avatar.clientWidth-HUD_Avoid_Mouse.adjust)*2)+"px";
						_avatar.style.right = "";
						if(Math.abs(parseInt(_avatar.style.left))>=_avatar.clientWidth)
						{
							_avatar.style.left = "";
							_avatar.style.right = -_avatar.clientWidth+"px";
						}
					}
					else
					{
						_avatar.style.right = (-(HUD_Avoid_Mouse.adjust*2))+"px";
						_avatar.style.left = "";
					}
				}

				HUD_Avoid_Mouse.adjust-=HUD_Avoid_Mouse.speed;
			},
			scared:function(x, y){
				if(_status.style.opacity<1)return;
				if(x<=_status.clientWidth+HUD_Avoid_Mouse.avoid)
				if(clientHeight-y-135<=_status.clientHeight+HUD_Avoid_Mouse.avoid)  // -85 for header, -55 for the endTurn button
				{
					_status.style.opacity = .25;
				}
			},
			show:function(){
				_avatar.style.opacity = 1;
				_status.style.opacity = 1;
				_helpers.style.opacity = 1;
			},
			interact:function(){
				HUD_Avoid_Mouse.idle_time = 0;
				// if(gameWidth>=600)return;
				_avatar.style.opacity = 0;
				_status.style.opacity = 1;
				_helpers.style.opacity = .5;
			},
			tick:function(){
				HUD_Avoid_Mouse.Switch_X();
				if(HUD_Avoid_Mouse.idle_time>HUD_Avoid_Mouse.time_without_interaction)
				{
					_avatar.style.opacity = 1;
					_status.style.opacity = 1;
					_helpers.style.opacity = 1;
					return;
				}
				HUD_Avoid_Mouse.idle_time++;
			}
		};
		Canvas.Add_Ticker(HUD_Avoid_Mouse.tick);
	}
	self.interact = function() {
		HUD_Avoid_Mouse.interact();
	};
	var m_move_fnc = function(x, y){
		HUD_Avoid_Mouse.scared(x, y);
		if(!allow_input)return;
		if(mousedown && !in_hl_path)return;
		x/=self.inputXScale;
		y/=self.inputYScale;
		if(!window.parent.mobilecheck())
		{
			var dir = overSliders(x/self.gameXScale,y/self.gameYScale);
			if(dir==0)
			{
				if(!hovered_dir[0])
				if(scroller.getValues().top!=0)
				{
					hovered_dir[0] = true;
					// self.Slide_Up.Alpha.Set(1);
					return;
				}
			}
			else if(hovered_dir[0])
			{
				hovered_dir[0] = false;
				// self.Slide_Up.Alpha.Set(0);
			}
			if(dir==1)
			{
				if(!hovered_dir[1])
				if(scroller.getValues().top!=scroller.getScrollMax().top)
				{
					hovered_dir[1] = true;
					// self.Slide_Down.Alpha.Set(1);
					return;
				}
			}
			else if(hovered_dir[1])
			{
				hovered_dir[1] = false;
				// self.Slide_Down.Alpha.Set(0);
			}
			if(dir==2)
			{
				if(!hovered_dir[2])
				if(scroller.getValues().left!=0)
				{
					hovered_dir[2] = true;
					// self.Slide_Left.Alpha.Set(1);
					return;
				}
			}
			else if(hovered_dir[2])
			{
				hovered_dir[2] = false;
				// self.Slide_Left.Alpha.Set(0);
			}
			if(dir==3)
			{
				if(!hovered_dir[3])
				if(scroller.getValues().left!=scroller.getScrollMax().left)
				{
					hovered_dir[3] = true;
					// self.Slide_Right.Alpha.Set(1);
					return;
				}
			}
			else if(hovered_dir[3])
			{
				hovered_dir[3] = false;
				// self.Slide_Right.Alpha.Set(0);
			}
		}
		self.Hover_Tile(Math.floor((x+scroller.getValues().left)/TILESIZE),Math.floor((y+scroller.getValues().top)/TILESIZE));
	};
	self.Click = click_fnc;
	self.Release = release_fnc;
	self.Right_Click = r_click_fnc;
	self.Mouse_Move = m_move_fnc;

	self.Draw = function()
	{
		_requested_update = true;
	};
	let scroller = new Scroller(render,{
		locking:false,
		zooming:true
	});
	self.reflow = function(w, h)
	{	// client -> container size, game -> playable area
		clientWidth = w;
		clientHeight = h;

		gameWidth = w>600 ? 600 : w;
		gameHeight = (h>600 ? 600 : h) - 85;

		self.gameWidth = gameWidth;
		self.gameHeight = gameHeight;
		self.gameXScale = gameWidth/600;
		self.gameYScale = gameHeight/600;
		Dialog_Display.Scale(self.gameXScale, self.gameYScale);
		HUD_Display.Scale(self.gameXScale, self.gameYScale);
		if(open_menu && menu_scale){
			open_menu.Scale((gameWidth-210)/600, (gameHeight-65)/600);
			return;
		}
		if(game==null)return;

		scroller.setDimensions(gameWidth, gameHeight, game.Terrain_Map.Width*TILESIZE, game.Terrain_Map.Height*TILESIZE);
	};

	/** functions */
	let _requested_update = true;
	self.Next_Frame = function()
	{
		if(_requested_update)
		{
			scroller.repaint();
			_requested_update = false;
		}
	};
	Canvas.Add_Ticker(self.Next_Frame);
	self.Simple_Draw = function()
	{
		scroller.simple_repaint();
	};
	self.Sample_Draw = function(canvas, x, y, w, h, sampledGame)
	{
		Canvas.ScaleImageData(canvas, self.Get_Sample(sampledGame),
			x, y, w/sampledGame.Terrain_Map.Width*TILESIZE, h/sampledGame.Terrain_Map.Height*TILESIZE);
	};
	self.Get_Sample = function(sampledGame)
	{
		if(sampledGame==null)return;
		if(!sampledGame.valid)return;
		let fullWidth = sampledGame.Terrain_Map.Width*TILESIZE;
		let fullHeight = sampledGame.Terrain_Map.Height*TILESIZE;
		imageHolderCanvas.clearRect(0, 0, fullWidth, fullHeight);
		for(let i=0;i<sampledGame.Terrain_Map.Width;i++)
		for(let j=0;j<sampledGame.Terrain_Map.Height;j++){
			var at = sampledGame.Terrain_Map.At(i,j);
			if(at!=null){
				at.UI_Draw(imageHolderCanvas, i*TILESIZE, j*TILESIZE, 1);
				at = at.Building;
				if(at!=null)at.UI_Draw(imageHolderCanvas, i*TILESIZE, j*TILESIZE, 1);
			}
			at = sampledGame.Units_Map.At(i,j);
			if(at!=null&&at!=moving_unit)at.UI_Draw(imageHolderCanvas, i*TILESIZE, j*TILESIZE, 1);
		}
		if(TILESIZE!=60)
		{
			return scale(imageHolderCanvas.getImageData(0, 0, fullWidth, fullHeight), 60/TILESIZE, 60/TILESIZE);
		}
		return imageHolderCanvas.getImageData(0, 0, fullWidth, fullHeight);
	};
	self.Get_Terrain_Image = function(sampledGame)
	{
		if(sampledGame==null)return;
		if(!sampledGame.valid)return;
		var fullWidth = sampledGame.Terrain_Map.Width*TILESIZE;
		var fullHeight = sampledGame.Terrain_Map.Height*TILESIZE;
		imageHolderCanvas.clearRect(0, 0, fullWidth, fullHeight);
		for(var i=0;i<sampledGame.Terrain_Map.Width;i++)
		for(var j=0;j<sampledGame.Terrain_Map.Height;j++){
			var at = sampledGame.Terrain_Map.At(i,j);
			if(at!=null){
				at.UI_Draw(imageHolderCanvas, i*TILESIZE, j*TILESIZE, 1);
				// at = at.Building;
				// if(at!=null)at.UI_Draw(imageHolderCanvas, i*TILESIZE, j*TILESIZE, 1);
			}
		}
		return imageHolderCanvas.getImageData(0, 0, fullWidth, fullHeight);
	};
	self.Update_Player_Info = function()
	{
		Avatar.Player_List(game.Active_Player());
	};
	self.Income_Draw = function(tile_x, tile_y, amount)
	{
		let x = (tile_x*TILESIZE)-self.X_Offset(),
			y = ((tile_y+0.6)*TILESIZE)-self.Y_Offset();
		let risingTxt = HUD_Display.Add_Drawable(new Text_Class("20pt Arial","#FF0800"), "Income "+x+","+y,
				x, y, 100, 30, "$"+amount);
		Core.Slide_Drawable_Y(risingTxt, -TILESIZE, 20, function(){
			Core.Fade_Drawable(risingTxt, 0, 19);
			Core.Slide_Drawable_Y(risingTxt, -TILESIZE, 20, function(){
				HUD_Display.Delete_Drawable(risingTxt);
			});
		});
	};
	self.Resource_Draw = function(canvas, cash)
	{
		if(self.IS_MOBILE_GAME)
		{
			canvas.globalAlpha = 0.7;
			Shape.Rectangle.Draw(canvas, 2, 35, 55, 25, "#4B5320");
			Shape.Box.Draw(canvas, 2, 35, 55, 25, "#ccc");
			canvas.globalAlpha = 1;
			new Text_Class("16pt Verdana","#FFF").Draw(canvas, 4, 39, 55, 25, (cash>999 ? "" : "$")+cash);
		}
		else
		{
			Shape.Rectangle.Draw(canvas, 5, 40, 35, 12, "#ccc");
			Shape.Rectangle.Draw(canvas, 6, 41, 33, 10, "#4B5320");
			new Text_Class("8pt Arial","#FFF").Draw(canvas, 7, 42, TILESIZE, 10, "$"+cash);
		}
	};
	function moverRender(_unit, list){
		var canvas = uiCanvas;
		var _x = _unit.X*TILESIZE-scroller.getValues().left,
			_y = _unit.Y*TILESIZE-scroller.getValues().top;
		canvas.clearRect(0,0,900,900);


		if(list.length<=1)
		{
			_unit.Update_Danger(_unit.X, _unit.Y);
			// self.Draw();
			canvas.drawImage(_select_img, _x, _y, TILESIZE, TILESIZE);
			return;
		}
		_unit.Update_Danger(list[list.length-1][0], list[list.length-1][1]);
		// self.Draw();

		canvas.save();
		canvas.globalAlpha = .85;

		canvas.translate(_x, _y);
		canvas.save();
		if(list[0][0]+1==list[1][0])
		{	// to right
			canvas.translate(0, TILESIZE);
			canvas.rotate(270*Math.PI/180);
		}
		else if(list[0][0]-1==list[1][0])
		{	// to left
			canvas.translate(TILESIZE, 0);
			canvas.rotate(90*Math.PI/180);
		}
		else if(list[0][1]-1==list[1][1])
		{	// go up
			canvas.translate(TILESIZE, TILESIZE);
			canvas.rotate(180*Math.PI/180);
		}
		ArrowStart.Draw(canvas, 0, 0, TILESIZE, TILESIZE);
		canvas.restore();

		for(var i=1;i<list.length-1;i++)
		{
			if(list[i-1][0]+1==list[i][0])
			{	// from left
				canvas.translate(TILESIZE, 0);
				canvas.save();
				if(list[i][0]+1==list[i+1][0])
				{	// to right
					ArrowStraight.Draw(canvas, 0, 0, TILESIZE, TILESIZE);
				}
				else if(list[i][1]-1==list[i+1][1])
				{	// go up
					canvas.translate(0, TILESIZE);
					canvas.rotate(270*Math.PI/180);
					ArrowTurn.Draw(canvas, 0, 0, TILESIZE, TILESIZE);
				}
				else if(list[i][1]+1==list[i+1][1])
				{	// go down
					canvas.translate(TILESIZE, TILESIZE);
					canvas.rotate(180*Math.PI/180);
					ArrowTurn.Draw(canvas, 0, 0, TILESIZE, TILESIZE);
				}
			}
			else if(list[i-1][0]-1==list[i][0])
			{	// from right
				canvas.translate(-TILESIZE, 0);
				canvas.save();
				if(list[i][0]-1==list[i+1][0])
				{	// to left
					ArrowStraight.Draw(canvas, 0, 0, TILESIZE, TILESIZE);
				}
				else if(list[i][1]-1==list[i+1][1])
				{	// go up
					ArrowTurn.Draw(canvas, 0, 0, TILESIZE, TILESIZE);
				}
				else if(list[i][1]+1==list[i+1][1])
				{	// go down
					canvas.translate(TILESIZE, 0);
					canvas.rotate(90*Math.PI/180);
					ArrowTurn.Draw(canvas, 0, 0, TILESIZE, TILESIZE);
				}
			}
			else if(list[i-1][1]-1==list[i][1])
			{	// from down
				canvas.translate(0, -TILESIZE);
				canvas.save();
				if(list[i][0]+1==list[i+1][0])
				{	// to right
					canvas.translate(TILESIZE, 0);
					canvas.rotate(90*Math.PI/180);
					ArrowTurn.Draw(canvas, 0, 0, TILESIZE, TILESIZE);
				}
				else if(list[i][0]-1==list[i+1][0])
				{	// go left
					canvas.translate(TILESIZE, TILESIZE);
					canvas.rotate(180*Math.PI/180);
					ArrowTurn.Draw(canvas, 0, 0, TILESIZE, TILESIZE);
				}
				else if(list[i][1]-1==list[i+1][1])
				{	// go up
					canvas.translate(TILESIZE, 0);
					canvas.rotate(90*Math.PI/180);
					ArrowStraight.Draw(canvas, 0, 0, TILESIZE, TILESIZE);
				}
			}
			else if(list[i-1][1]+1==list[i][1])
			{	// from up
				canvas.translate(0, TILESIZE);
				canvas.save();
				if(list[i][0]-1==list[i+1][0])
				{	// to left
					canvas.translate(0, TILESIZE);
					canvas.rotate(270*Math.PI/180);
					ArrowTurn.Draw(canvas, 0, 0, TILESIZE, TILESIZE);
				}
				else if(list[i][0]+1==list[i+1][0])
				{	// to right
					// canvas.rotate(90*Math.PI/180);
					ArrowTurn.Draw(canvas, 0, 0, TILESIZE, TILESIZE);
				}
				else if(list[i][1]+1==list[i+1][1])
				{	// go down
					canvas.translate(TILESIZE, 0);
					canvas.rotate(90*Math.PI/180);
					ArrowStraight.Draw(canvas, 0, 0, TILESIZE, TILESIZE);
				}
			}
			canvas.restore();
		}

		canvas.save();
		var end = list.length-1;
		var before = end-1;
		if(list[before][0]-1==list[end][0])
		{	// to left
			canvas.translate(0, TILESIZE);
			canvas.rotate(180*Math.PI/180);
		}
		else if(list[before][1]+1==list[end][1])
		{	// go down
			canvas.translate(TILESIZE, TILESIZE);
			canvas.rotate(90*Math.PI/180);
		}
		else if(list[before][1]-1==list[end][1])
		{	// go up
			canvas.translate(0, 0);
			canvas.rotate(270*Math.PI/180);
		}
		else canvas.translate(TILESIZE, 0);
		ArrowEnd.Draw(canvas, 0, 0, TILESIZE, TILESIZE);
		canvas.restore();

		canvas.restore();
	}

	let Map_Data = {
		Searching:0,
		Next_Search:[],
		All_Data:[],
		Caption: new Text_Class("25pt Raleway", "#D7EFD0"),
		Owner: new Text_Class("20pt Raleway", "#C2D8BC")
	};
	self.Update_Map_Search = function(_data_text)
	{			// data, y row index
		if(Map_Data.Next_Search.length==0)return;
		Map_Data.Searching = Map_Data.Next_Search.shift();

		let _read_game_data = new Array(_data_text.length),
			_game_imgs = new Array(_data_text.length),
			_loading_icons = new Array(_data_text.length),
			names = new Array(_data_text.length);

		let id_start = document.getElementById("MAPSELECTIONROW").childNodes[Map_Data.Searching*2+1].childNodes[0];
		id_start = id_start.childNodes[id_start.childNodes.length-1].id;

		Map_Data.All_Data[id_start] = new Array();

		for(let ii=0;ii<5;ii++)
		{
			let row_holder = document.getElementById(id_start+ii);
			for(let jj=0;jj<row_holder.childNodes.length;jj++)
			{
				if(row_holder.childNodes[jj].className=="MAPCHOICEIMG")
				{
					row_holder.removeChild(row_holder.childNodes[jj]);
					jj--;
				}
			}
		}

			/// start load maps
		for(let index in _data_text)
		{
			let MAPID = _data_text[index].mapid;
			names[index] = _data_text[index].name;
			_data_text[index] = decrypt_game_data(_data_text[index].game);
			_read_game_data[index] = Map_Reader.String(_data_text[index]);
			if(MAPID!=null)
			{	// for updates to the MAP ID post game upload.
				_read_game_data[index].id = MAPID;
			}
			let row_holder = document.getElementById(id_start+index);
			_loading_icons[index] = document.createElement('div');
			_loading_icons[index].innerHTML = '<div class="lds-ellipsis"><div></div><div></div><div></div></div>';
			row_holder.appendChild(_loading_icons[index]);

			if(_read_game_data[index].Valid)
			{
				setTimeout(function(index){
					let sampledGame = new Engine_Class(_read_game_data[index], true);
					sampledGame.Set_Interface(INTERFACE);
					sampledGame.FORCE_MERGE_DISPLAY = true;
					_game_imgs[index] = INTERFACE.Get_Sample(sampledGame);
					imageHolderCanvas.clearRect(0, 0, 900, 900);
					worldCanvas.clearRect(0, 0, 900, 900);

						///** Create and draw image **//
					let canvas = document.createElement("canvas");
					canvas.width = 600;
					canvas.height = 600;
					let ctx = canvas.getContext("2d");

					Canvas.ScaleImageData(ctx, _game_imgs[index], 0, 0, 10/sampledGame.Terrain_Map.Width, 10/sampledGame.Terrain_Map.Height);
					sampledGame.End_Game();

					// ctx.globalAlpha = .2;
					// Shape.Rectangle.Draw(ctx,0,0,600,600,"#E5D1D0");
					ctx.globalAlpha = .7;
					Shape.Rectangle.Draw(ctx,50,20,500,100,"#57634E");
					ctx.globalAlpha = 1;
					Shape.Box.Draw(ctx,0,0,600,600,"#73877B");

					Map_Data.Caption.Draw(ctx,65,30,500,40,_read_game_data[index].Name);
					if(names[index]!=null)
						Map_Data.Owner.Draw(ctx,65,80,500,40,"by "+names[index]);

					let img = document.createElement("img");
					img.src = canvas.toDataURL("image/png");
					img.className = "MAPCHOICEIMG";
					try {
						Map_Data.All_Data[id_start].push(_read_game_data[index]);
					} catch (e) {

					}

					try {
						row_holder.removeChild(_loading_icons[index]);
						row_holder.appendChild(img);
						row_holder.onclick = function() {
							onClick(img);
						};
					} catch (e) {
						console.error(id_start+index);
					} finally {

					}
				}, 15, index);
			}
		}
	};

	let menuCloser;

	let __map_choice = "", __map_img;
	let __map_game_setup = false;
	let last_q, query_type = 0;
	let search_fnc = function(index, query)
	{
		if(last_q==query)
			return;
		if(query.length<=2)
			return 1;
		if(query.includes("'") || query.includes('"'))
			return 2;
		if(query.includes(".") || query.includes(';'))
			return 2;
		if(query.includes('\\') || query.includes('\/'))
			return 2;

		function escapeRegExp(string){
			return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
		}
		last_q = query;
		let QUERY = {};
		switch (query_type) {
			case 0:
				QUERY.mapowner = "^"+escapeRegExp(query);
				QUERY.mapdata = escapeRegExp(encrypt_game_data(query));
				break;
			case 1:
				QUERY.Map_Id = query.replace(/-/g, "").replace(/ /g, "");
				break;
			default:
				return;
		}
		if(index==0)
			QUERY.mapowner = "freemaps";

		Map_Data.Next_Search.push(index);
		socket.emit('gamedata get', QUERY, 0, 5);
	};
	function makeElement(_id)
	{
		let el = document.createElement('div');
		el.className = "MAPCHOICE w3-center";
		el.id = _id;
		return el;
	}
	function makeList(third, name, searchFunc, searchindex)
	{
		let insertTag = document.createElement('div');
		let text_tag = document.createElement('h4');
		text_tag.innerHTML = name;
		text_tag.id = name;
		insertTag.style = "padding-left:15%";
		insertTag.style.height = "40px";
		third.appendChild(insertTag);
		for(let i=0;i<5;i++)
			third.appendChild(makeElement(name+i));

		if(searchFunc)
		{
			insertTag.style.cursor = "pointer";
			let search = document.createElement('div');
			search.className = "search-wrapper";
			text_tag.style = "padding-left:60px";

			let div = document.createElement('div');
			div.className = "search-container";
			let input = document.createElement('input');
			input.className = "search-input";
			input.placeholder = "Search";
			input.type = "text";
			div.appendChild(input);
			let icon = document.createElement('i');
			icon.className = "fa fa-search";
			div.appendChild(icon);

				// search icon slide functionality
			insertTag.onclick = function() {
				div.className+=" active";
				input.className+=" active";
				input.focus();
				text_tag.innerHTML = "&nbsp;";
			};
			input.onblur = function() {
				div.className = "search-container";
				input.className = "search-input";
				text_tag.innerHTML = name;

				search_fnc(searchindex, input.value);
			};
			input.onkeyup = function(e) {
				if(e.keyCode!=13)return;

				let ER_CHECK = search_fnc(searchindex, input.value);
				if(ER_CHECK==1)
				{
					LOG.popup("Search too short!");
				}
				if(ER_CHECK==2)
				{
					LOG.popup("Cannot search for some of those special characters");
				}
			};

			search.appendChild(div);
			insertTag.appendChild(search);
		}

		insertTag.appendChild(text_tag);
	}

	self.Map_Choice = function(__choice, __img)
	{
		__map_choice = __choice;
		__map_img = __img;
	};
	self.Open_Level_Select = function()
	{
		if(game)return;
		self.Close_Menu();

		Map_Data.All_Data = [];
		Map_Data.Next_Search = [];
		__map_game_setup = true;

		let third1 = document.getElementById("third-1");
		let third2 = document.getElementById("third-2");
		let third3 = document.getElementById("third-3");

		for(let i=0;i<third1.childNodes.length;)
			third1.removeChild(third1.childNodes[0]);
		for(let i=0;i<third2.childNodes.length;)
			third2.removeChild(third2.childNodes[0]);
		for(let i=0;i<third3.childNodes.length;)
			third3.removeChild(third3.childNodes[0]);

		makeList(third1, "Free Maps", true, 0);
		makeList(third2, "Recent Uploads");
		makeList(third3, "Search", true, 2);

		Map_Data.Next_Search.push(0);
		socket.emit('gamedata get', {mapowner:'freemaps'}, 0, 5);
		Map_Data.Next_Search.push(1);
		socket.emit('gamedata get', {}, 0, 5);
	};
	self.Open_Story = function()
	{
		if(game)return;
		self.Close_Menu();

		Map_Data.All_Data = [];
		Map_Data.Next_Search = [];
		__map_game_setup = false;

		let third1 = document.getElementById("third-1");
		let third2 = document.getElementById("third-2");
		let third3 = document.getElementById("third-3");

		for(let i=0;i<third1.childNodes.length;)
			third1.removeChild(third1.childNodes[0]);
		for(let i=0;i<third2.childNodes.length;)
			third2.removeChild(third2.childNodes[0]);
		for(let i=0;i<third3.childNodes.length;)
			third3.removeChild(third3.childNodes[0]);

		makeList(third1, "U vs The World");
		makeList(third2, "Ancient Europe");
		makeList(third3, "Shogun Isolation");

		let __unlocked_data = Levels.Current();
		let __data = new Array(__unlocked_data.length);

		for(let i=0;i<__data.length;i++)
		{
			__data[i] = new Array(__unlocked_data[i]);
			for (let j=0;j<__unlocked_data[i];j++) {
				__data[i][j] = {game:Levels.Data(i, j), name:null};
			}
		}

		Map_Data.Next_Search.push(0);
		Map_Data.Next_Search.push(1);
		Map_Data.Next_Search.push(2);
		self.Update_Map_Search(__data[0]);
		self.Update_Map_Search(__data[1]);
		self.Update_Map_Search(__data[2]);
	};
	self.Open_Game = function()
	{
		let DATA = Map_Data.All_Data[__map_choice.substring(0, __map_choice.length-1)][parseInt(__map_choice.charAt(__map_choice.length-1))];

		if(__map_game_setup)
		{
			new_custom_game(DATA, [DATA.Name, __map_img]);
			return;
		}

		let section = 0;
		for(let index in Map_Data.All_Data)
		{
			if(__map_choice.substring(0, __map_choice.length-1)==index)
				break;
			section++;
		}
		new_custom_game(DATA, [DATA.Name], true, null, Levels.Current()[section]==parseInt(__map_choice.charAt(__map_choice.length-1))+1 ? 2 : 3, section);
	};


	self.Open_Unit_Create_Menu = function(player, resources, onBuildFnc, onCloseFnc)
	{
		if(player.Game.Client_Player()!=player)return;
		if(onBuildFnc==null)return;

		MUSIC = MUSIC.Switch(Music.Retrieve("thought music"), 1000);

		lastScroller = scroller;
		menuCloser = function(){
			MUSIC = MUSIC.Switch(Music.Retrieve("player turn"), 1000);
			scroller = lastScroller;
			lastScroller = null;
			Menu.Game_Prompt.Erase();
			self.Select_Tile();
			menuCloser = null;
		};

		var TITLE_TEXT = new Text_Class("20pt Verdana", pallet.title);
		var NAME_TEXT = new Text_Class("15pt Verdana", pallet.border);
		var COST_TEXT = new Text_Class("15pt Verdana", pallet.text);
		var BAD_TEXT = new Text_Class("15pt Verdana", pallet.bad);

		with(Menu.Game_Prompt)
		{
			Erase();
			STOP_EVENT_CLICKS = false;

			let draw_top = 50,
				draw_left = 10,
				draw_width = 175,
				draw_height = 75;

			Add(new Canvas.Drawable(Shape.Rectangle, null, 0, 0, 900, 900, pallet.border, null, 0.45), function(){
				if(onCloseFnc!=null)
					onCloseFnc();
					self.Close_Menu();
			});

				// gound units
			Add(new Canvas.Drawable(TITLE_TEXT, null, draw_left, draw_top-30, draw_width+20, 7*draw_height, "Ground Units"));
			Add(new Canvas.Drawable(Shape.Rectangle, null, draw_left, draw_top, draw_width, 7*draw_height, pallet.inside, null, .4));
			Add(new Canvas.Drawable(Shape.Box, null, draw_left, draw_top, draw_width, 7*draw_height, pallet.border));
				// air units
			Add(new Canvas.Drawable(TITLE_TEXT, null, 200+draw_left, draw_top-30, draw_width, 7*draw_height, "Air Units"));
			Add(new Canvas.Drawable(Shape.Rectangle, null, 200+draw_left, draw_top, draw_width, 7*draw_height, pallet.inside, null, .4));
			Add(new Canvas.Drawable(Shape.Box, null, 200+draw_left, draw_top, draw_width, 7*draw_height, pallet.border));
				// sea units
			Add(new Canvas.Drawable(TITLE_TEXT, null, 400+draw_left, draw_top-30, draw_width, 7*draw_height, "Sea Units"));
			Add(new Canvas.Drawable(Shape.Rectangle, null, 400+draw_left, draw_top, draw_width, 7*draw_height, pallet.inside, null, .4));
			Add(new Canvas.Drawable(Shape.Box, null, 400+draw_left, draw_top, draw_width, 7*draw_height, pallet.border));


			var _units = player.Buildable_Units();
			let drawer = {
				Draw:function(c,x,y,w,h,index){
					var __unit_index = Math.abs(index);
					var BG = pallet.validBG;
					var _COST_ = COST_TEXT;
					var UNIT_IMAGE = Char_Data.CHARS[__unit_index].Sprite[0];

					if(index<0)
					{	// grey unit cuz cant afford
						BG = pallet.invalidBG;
						_COST_ = BAD_TEXT;
						// UNIT_IMAGE = Char_Data.CHARS[__unit_index].Sprite[0];
					}
					// normal unit
					Shape.Rectangle.Draw(c,x,y,w,h,BG);
					Shape.Box.Draw(c,x,y,w,h,pallet.border);
					// here put the unit image
					UNIT_IMAGE.Draw(c,x+10,y+15,40,40,Char_Data.CHARS[__unit_index].Name);
					NAME_TEXT.Draw(c,x+50,y+15,w-50,h,Char_Data.CHARS[__unit_index].Name);
					_COST_.Draw(c,x+115,y+55,w,h,"$"+player.Calculate_Cost(__unit_index));
				}
			};
			let hl_drawer = {
				Draw:function(c,x,y,w,h,s) {
					drawer.Draw(c,x,y,w,h,s);
					c.save();
					c.globalAlpha *= .35;
					Shape.Rectangle.Draw(c,x,y,w,h,"#FF0");
					c.restore();
				}
			};
			let click_fnc = function(index){
				self.Close_Menu();
				onBuildFnc(index);
			};
			let g_list = [new Array(), new Array(), new Array()];
			let ground_index = 0,
				air_index = 0,
				sea_index = 0;
			for(var j in _units)
			{
				var __unit = Char_Data.CHARS[_units[j]],
					x = draw_left,
					y = draw_top;
				if(__unit.Type==1)
				{
					x+=200;
					y+=(air_index++)*draw_height;
				}
				else if(__unit.Type==2)
				{
					x+=400;
					y+=(sea_index++)*draw_height;
				}
				else y+=(ground_index++)*draw_height;

				var cur_drawable = new Canvas.Drawable(drawer, null, x, y, draw_width, draw_height, _units[j]);

				cur_drawable.Index = Menu.Game_Prompt;
				g_list[__unit.Type].push(cur_drawable);

				if(y>=525)
				{
					cur_drawable.Alpha.Set(0);
				}

				if(player.Calculate_Cost(_units[j])>resources)
				{	// can't afford!
					Add(cur_drawable);
					cur_drawable.Index = Canvas.No_Draw;
					cur_drawable.State.Set(-_units[j], false);
					continue;
				}
				Add(cur_drawable, click_fnc, hl_drawer);
			}


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
			g_list_display.setup(600, 7*draw_height, 3*draw_width, Math.max(Math.max(ground_index, air_index), sea_index)*draw_height, draw_width, draw_height);

			let g_list_scroller = new Scroller(function(left, top, zoom)
			{
				top*=draw_height/TILESIZE;
				g_list_display.render(left, top, zoom, list_painter);
			}, {
				locking:false,
				zooming:false
			});

			g_list_scroller.setDimensions(3*draw_width, 80, 4, (Math.max(Math.max(ground_index, air_index), sea_index)-5)*TILESIZE);

			scroller = g_list_scroller;
		};

		self.Display_Menu(Menu.Game_Prompt);
	};
	self.Open_Unit_Direction_Choice = function(unit, directions, onDecisionFnc)
	{
		if(onDecisionFnc==null)return;
		if(directions.length==0)
		{
			onDecisionFnc(-1);
			return;
		}

		with(Menu.Game_Prompt)
		{
			Erase();
			Add(new Canvas.Drawable(Shape.Rectangle, null, 0, 0, 600, 600, pallet.border, null, 0.25), function(){
				self.Close_Menu();
				Menu.Game_Prompt.Erase();
				self.Select_Tile();
				onDecisionFnc();
			});

			var click_fnc = function(input)
			{
				self.Close_Menu();
				Menu.Game_Prompt.Erase();
				self.Select_Tile();
				onDecisionFnc(input);
			};
			var _x = unit.X*TILESIZE-self.X_Offset(),
				_y = unit.Y*TILESIZE-self.Y_Offset();

			for(var i in directions)
			{
				if(directions[i]==0)
				{	// left
					Add(new Canvas.Drawable({
						Draw:function(c,x,y,w,h,s){
							c.save();
							c.translate(x+TILESIZE, y+TILESIZE);
							c.rotate(180*Math.PI/180);
							ArrowEnd.Draw(c,0,0,w,h);
							c.restore();
						}
					}, null, _x-TILESIZE, _y, TILESIZE, TILESIZE, directions[i]), click_fnc);
					continue;
				}
				if(directions[i]==1)
				{	// up
					Add(new Canvas.Drawable({
						Draw:function(c,x,y,w,h,s){
							c.save();
							c.translate(x, y+TILESIZE);
							c.rotate(270*Math.PI/180);
							ArrowEnd.Draw(c,0,0,w,h);
							c.restore();
						}
					}, null, _x, _y-TILESIZE, TILESIZE, TILESIZE, directions[i]), click_fnc);
					continue;
				}
				if(directions[i]==2)
				{	// right
					Add(new Canvas.Drawable({
						Draw:function(c,x,y,w,h,s){
							c.save();
							c.translate(x, y);
							ArrowEnd.Draw(c,0,0,w,h);
							c.restore();
						}
					}, null, _x+TILESIZE, _y, TILESIZE, TILESIZE, directions[i]), click_fnc);
					continue;
				}
				if(directions[i]==3)
				{	// down
					Add(new Canvas.Drawable({
						Draw:function(c,x,y,w,h,s){
							c.save();
							c.translate(x+TILESIZE, y);
							c.rotate(90*Math.PI/180);
							ArrowEnd.Draw(c,0,0,w,h);
							c.restore();
						}
					}, null, _x, _y+TILESIZE, TILESIZE, TILESIZE, directions[i]), click_fnc);
					continue;
				}
			}
		}

		self.Display_Menu(Menu.Game_Prompt, true);
	};

	self.Allow_Controls = function(input)
	{
		if(input)Select_Animation.Stop = false;
		else
		{
			self.Select_Tile();
			self.Close_Menu();
			Select_Animation.Stop = true;
			mousedown = false;
		}
		allow_input = input;
		dialogCanvas.clearRect(0,0,600,600);
	};
	self.Check_Controls = function()
	{
		return allow_input;
	};
	self.Start = function()
	{
		changeContent("GAME PLAY", game.Name);
		if(game.Online_Game())
		{
			window.parent.openChat();
		}
		Avatar.Set_Up(game.Total_Players());

		HUD_Avoid_Mouse.show();
		Animations.kill = false;
		for(var x=1;x<Terrain_Data.TERRE.length;x++)
		{
			var _t = Terrain_Data.TERRE[x];
			if(_t.Connnection==5 || _t.Connnection==3)
				Animations.Retrieve(_t.Name+" Ani").Stop = false;
		}
		Repair_Animation.Stop = false;
		Mod_List.Units.Self_Action.Irreparable.Sprite = Mod_List.Units.Self_Action.Repairable.Sprite;
		Mod_List.Units.Self_Action.Irreparable.Active = false;
		SFXs.Stop_All();
		Music.Stop_All();
		Enviornment.Stop_All();
		MUSIC = Music.Retrieve("game intro").Play();
		MUSIC.Volume(1);
		Music.Retrieve("player turn").Volume(0);
		Music.Retrieve("thought music").Volume(0);
		Music.Retrieve("hurry warning").Volume(0);
		Music.Retrieve("enemy turn").Volume(0);
		Music.Retrieve("ally turn").Volume(0);
		Music.Retrieve("player turn").Play();
		Music.Retrieve("thought music").Play();
		Music.Retrieve("hurry warning").Play();
		Music.Retrieve("enemy turn").Play();
		Music.Retrieve("ally turn").Play();
	};
	self.End_Game = function(game_won, Players, turns, change_to_end_screen)
	{
		if(open_menu)
			self.Close_Menu();
		Avatar.Clear();
		Animations.kill = true;
		Music.Stop_All();
		SFXs.Stop_All();
		Enviornment.Stop_All();
		if(Players!=null)
			MUSIC = Music.Retrieve("game "+ (game_won ? "won" : "lost")).Play();
		document.getElementById("end-game-results").innerHTML = (game_won ? "YOU WON!!" : "GOOD TRY!");
		for(var x=1;x<Terrain_Data.TERRE.length;x++)
		{
			var _t = Terrain_Data.TERRE[x];
			if(_t.Connnection==5 || _t.Connnection==3)
				Animations.Retrieve(_t.Name+" Ani").Stop = true;
		}
		Repair_Animation.Stop = true;
		Canvas.Stop_All();
		Canvas.Set_Game(null);
		Dialog.Next();
		socket.game_id = null;
		if(change_to_end_screen)
		{
			if(Players!=null)
			{
					// records data
				function showList() {
						// order and rank winners
					Players = Core.Array.Organize.Descending(Players, function(index){
						return index.data.turns_alive;
					}, function(index){
						return index.data.damage_delt;
					}, function(index){
						return index.data.units_killed;
					}, function(index){
						return index.data.money_spent;
					});

						// clear table for clean display
					let LISTHOLDER = document.getElementById("end-game-list"), listEl;
					for (let i = 0; i < LISTHOLDER.childNodes.length;) {
						LISTHOLDER.childNodes[0].remove();
					}

					let header = document.createElement('tr');
					let head_data = document.createElement('th');
					head_data.innerHTML = "Player";
					header.appendChild(head_data);

					head_data = document.createElement('th');
					head_data.innerHTML = "Turns Alive";
					header.appendChild(head_data);

					head_data = document.createElement('th');
					head_data.innerHTML = "Units Killed";
					header.appendChild(head_data);

					head_data = document.createElement('th');
					head_data.innerHTML = "Money Spent";
					header.appendChild(head_data);

					LISTHOLDER.appendChild(header);

						// put winning order in ranked list
					for (let i = 0; i < Players.length; i++) {
						listEl = document.createElement('tr');
						listEl.style.textAlign = "left";
						listEl.style.backgroundColor = data_to_hex(Team_Colors.Color[Players[i].Color][0]);

						let td1 = document.createElement('td');
						let td2 = document.createElement('td');
						let td3 = document.createElement('td');
						let td4 = document.createElement('td');

						let pic = document.createElement('img');
						pic.src = Players[i].Icon.Source();
						pic.style.height = "65px";
						pic.className = "INFO-DATA";

						let place = document.createElement('h1');
						place.innerHTML = ""+(i+1);
						place.className = "INFO-DATA";

						let name = document.createElement('h3');
						name.innerHTML = "<b>"+Players[i].Name+"</b>";
						name.className = "INFO-DATA";

						let turns = document.createElement('div');
						turns.innerHTML = Players[i].data.turns_alive;
						turns.className = "INFO-DATA";

						let kills = document.createElement('div');
						kills.innerHTML = Players[i].data.units_killed;
						kills.className = "INFO-DATA";

						let money = document.createElement('div');
						money.innerHTML = "$"+Players[i].data.money_spent;
						money.className = "INFO-DATA";

						td1.appendChild(place);
						td1.appendChild(pic);
						td1.appendChild(name);
						td2.appendChild(turns);
						td3.appendChild(kills);
						td4.appendChild(money);
						listEl.appendChild(td1);
						listEl.appendChild(td2);
						listEl.appendChild(td3);
						listEl.appendChild(td4);

						LISTHOLDER.appendChild(listEl);
					}
				}
				let Records;
				try {
					Records = game.Get_Records().get();
				} catch (e) {
					LOG.popup("Apologies, there was an error with the detailed game record data.");
					showList();
					return;
				}
				let __data_turns = new Array(Records.length);
				let __data_players_standing = new Array(game.Total_Players());
				let __data_players_delt = new Array(game.Total_Players());
				let __data_players_recieved = new Array(game.Total_Players());
				let __data_s,__data_dd,__data_dr;

				for (let _t = 0; _t < __data_turns.length; _t++) {
					__data_turns[_t] = "Turn "+(_t+1);
				}
				for (let _p = 0; _p < __data_players_standing.length; _p++) {
					__data_s = new Array(Records.length);
					__data_dd = new Array(Records.length);
					__data_dr = new Array(Records.length);
					for (let _t = 0; _t < Records.length; _t++) {
						__data_s[_t] = Records[_t][_p].rating;
						__data_dd[_t] = Records[_t][_p].damage_delt;
						__data_dr[_t] = Records[_t][_p].damage_received;
					}
					__data_players_standing[_p] = {
						label: Players[_p].Name,
						fill: false,
						backgroundColor: data_to_hex(Team_Colors.Color[Players[_p].Color][2]),
						borderColor: data_to_hex(Team_Colors.Color[Players[_p].Color][1])+"77",
						data: __data_s
					};
					__data_players_delt[_p] = {
						label: Players[_p].Name,
						fill: false,
						backgroundColor: data_to_hex(Team_Colors.Color[Players[_p].Color][2]),
						borderColor: data_to_hex(Team_Colors.Color[Players[_p].Color][1])+"77",
						data: __data_dd
					};
					__data_players_recieved[_p] = {
						label: Players[_p].Name,
						fill: false,
						backgroundColor: data_to_hex(Team_Colors.Color[Players[_p].Color][2]),
						borderColor: data_to_hex(Team_Colors.Color[Players[_p].Color][1])+"77",
						data: __data_dr
					};
				}

				new Chart(document.getElementById('end-game-standings').getContext('2d'), {
					// The type of chart we want to create
					type: 'line',

					// The data for our dataset
					data: {
						labels: __data_turns,
						datasets: __data_players_standing
					},

					// Configuration options go here
					options: {}
				});
				new Chart(document.getElementById('end-game-damage-delt').getContext('2d'), {
					// The type of chart we want to create
					type: 'line',

					// The data for our dataset
					data: {
						labels: __data_turns,
						datasets: __data_players_delt
					},

					// Configuration options go here
					options: {}
				});
				new Chart(document.getElementById('end-game-damage-recieved').getContext('2d'), {
					// The type of chart we want to create
					type: 'line',

					// The data for our dataset
					data: {
						labels: __data_turns,
						datasets: __data_players_recieved
					},

					// Configuration options go here
					options: {}
				});

				showList();

				changeContent("END GAME", game.Name, true);

				window.parent.openLobby();
			}
		}
		this.setGame(null);
		if(online)socket.emit();
	};
	self.Request_Connections = function()
	{
		if(game==null)return [];
		return game.Request_Connections();
	};
	self.ReportLeft = function(leavingPlayer)
	{
		window.parent.refreshChatList();
	};

	function hl_map(map, display)
	{
		for(var i=0;i<map.length;i++)
		{
			game.Interface.Tiles.At(map[i][0], map[i][1]).Set(display);
		}
	}
	function highlight_path(path)
	{
		hl_map(path.Attackables(), 2);
		hl_map(path.All_Movable_Spaces(), 1);
	}
	function highlight_enemies(_game)
	{
		var danger = new Array();
		var total_players = _game.Total_Players(),
			cur_player;
		for(var i=0;i<total_players;i++)
		{
			cur_player = _game.Player(i);
			if(cur_player==_game.Client_Player())
				continue;
			for(var j=0;j<cur_player.Units_Amount();j++)
			{
				var unit = cur_player.Get_Unit(j),
					atks;
				if(_game.Terrain_Map.At(unit.X, unit.Y).Hidden)continue;
				unit.Start_Path();
				atks = unit.Current_Path().Attackables();
				for(var k=0;k<atks.length;k++)
				{
					danger.push(atks[k]);
				}
			}
		}
		hl_map(danger, 4);
		return danger;
	}
	function highlight_both(path)
	{
		hl_map(Core.Array.Overlapping_Positions(path.Attackables(), path.All_Movable_Spaces()), 3);
	}
	function unhighlight_path(path)
	{
		hl_map(path.Attackables(), 0);
		hl_map(path.All_Movable_Spaces(), 0);
	}

	this.HIGHLIGHT = function(){
		// Avatar._ThreathsBG.State.Set("#dd5040");
		return highlight_enemies(game);
	};
	this.UNHIGHLIGHT = function(_danger){
		// Avatar._ThreathsBG.State.Set("#EE6352");
		hl_map(_danger, 0);
	};


	var selected_tile = null;
	var hovered_tile = [-1,-1];
	var selected_unit = null;
	var hl_path = null;
	var moving_unit = null;
	let clearMoveCanvas = true;
	self.Set_Unit_Focus = function(value)
	{
		moving_unit = value;
		if(value==null)
			clearMoveCanvas = true;
	};
	self.Warn_Hurry = function()
	{
		if(game.Game_Over)return;
		if(game.Active_Player()!=game.Client_Player())return;
		MUSIC = MUSIC.Switch(Music.Retrieve("hurry warning"));
	};
	self.Stop_Hurry = function()
	{
		if(game.Game_Over)return;
		if(game.Active_Player()!=game.Client_Player())return;
		if(MUSIC!=Music.Retrieve("hurry warning"))return;
		MUSIC = MUSIC.Switch(Music.Retrieve("player turn"));
	};
	self.Set_Next_Player = function(player, callback)
	{
		self.Allow_Controls(false);
		Avatar.Player_List();
		if(player==game.Client_Player())
		{
			MUSIC = MUSIC.Switch(Music.Retrieve("player turn"));
		}
		else if(MUSIC!=Music.Retrieve("enemy turn"))
		{
			MUSIC = MUSIC.Switch(Music.Retrieve("enemy turn"));
		}
		Screen.Next_Player(player, function(){ // when done drawing player intro
			Avatar.Player_List(player);
			self.Allow_Controls(true);
			if(callback!=null)
				callback();
			self.Draw();
		});
	};
	self.Selected_Unit = function()
	{
		return selected_unit;
	};
	self.Selected_Tile = function()
	{
		return selected_tile;
	};
	self.Hover_Tile = function(x, y)
	{
		if(!allow_input)return;
		if(x==hovered_tile[0]&&y==hovered_tile[1])return;
		if(selected_unit!=null)
		{
			selected_unit.Mover.Add(x,y);
		}
		hovered_tile = [x,y];
	};
	self.Select_Tile = function(x, y, mobile_click)
	{
		if(arguments.length<2)
		{
			if(hl_path!=null)
			{
				unhighlight_path(hl_path);
			}
			if(selected_unit!=null)
			{
				if(selected_unit.Mover!=null)
				{
					selected_unit.Mover.Hide();
				}
				selected_unit.Close_Selection();
				selected_unit = null;
			}
			Status.Show_Info();
			selected_tile = null;
			if(_____danger.length>0)
			{
				self.UNHIGHLIGHT(_____danger);
				_____danger = self.HIGHLIGHT();
			}
			self.Draw();
			return;
		}
		if(!allow_input)return;

		if(selected_tile!=null)
		if(selected_tile[0]==x&&selected_tile[1]==y)
		{	// status click cycle goes:
			// Unit -> Building -> Terrain -> Unit
			// skipping when there is no data
			if(game.Terrain_Map.At(x,y).Hidden)return;
			if(Status.Info_Type==1)
			{
				var display = game.Terrain_Map.At(x,y);
				if(display.Building!=null)
					Status.Show_Info(display.Building);
				else Status.Show_Info(display);
			}
			else if(Status.Info_Type==2)
			{
				var display = game.Terrain_Map.At(x,y);
				if(display.Unit!=null)
					Status.Show_Info(display.Unit);
				else if(display.Building!=null)
					Status.Show_Info(display.Building);
				else Status.Show_Info(display);
			}
			else if(Status.Info_Type==3)
			{
				Status.Show_Info(game.Terrain_Map.At(x,y));
			}
			if(selected_unit!=null)
			{
				if(hl_path!=null)
				{
					unhighlight_path(hl_path);
				}
				if(selected_unit.Mover!=null)
				{
					selected_unit.Mover.Hide();
				}
				selected_unit.Open_Actions(true);
				selected_unit.Close_Selection();
				selected_unit = null;
			}
			if(_____danger.length>0)
			{
				self.UNHIGHLIGHT(_____danger);
				_____danger = self.HIGHLIGHT();
			}
			return;
		}

		selected_tile = [x,y];
		if(hl_path!=null)
		{
			unhighlight_path(hl_path);
		}
		if(selected_unit!=null)
		{	// second click after unit selected
			selected_unit.Mover.Hide();
			var check_unit = game.Units_Map.At(x,y);
			if(check_unit!=null)
			{
				if(game.Terrain_Map.At(x,y).Hidden)
				{
					selected_unit = null;
					var selected = game.Terrain_Map.At(x,y);
					if(selected.Building!=null)
					{
						selected = selected.Building;
						Status.Show_Info(selected);
						if(!selected.Active)return;
						if(selected.Owner!=game.Active_Player()||selected.Owner!=game.Client_Player())
						{
							if(_____danger.length>0)
							{
								self.UNHIGHLIGHT(_____danger);
								_____danger = self.HIGHLIGHT();
							}
							return;
						}
						selected.Act();
					}
					else Status.Show_Info(selected);
					return;
				}

				if(check_unit.Player==selected_unit.Player)
				{
					selected_tile = null;
					self.Select_Tile();
					if(_____danger.length>0)
					{
						self.UNHIGHLIGHT(_____danger);
						_____danger = self.HIGHLIGHT();
					}
					self.Select_Tile(x, y);
					return;
				}
			}
			var path = selected_unit.Mover.Path();
			let cur_unit = selected_unit;
			self.Allow_Controls(false);
			if(game.Move(cur_unit, x, y, path, function(){
				self.Allow_Controls(true);
			}))
			{
				game.Send_Move('send move', cur_unit.Index, x, y, path);
			}
			selected_tile = null;
			self.Select_Tile();
			if(_____danger.length>0)
			{
				self.UNHIGHLIGHT(_____danger);
				_____danger = self.HIGHLIGHT();
			}
			return;
		}
		var check_unit = game.Units_Map.At(x,y);
		if(game.Terrain_Map.At(x,y).Hidden || check_unit==null)
		{
			var selected = game.Terrain_Map.At(x,y);
			if(selected.Building!=null)
			{
				selected = selected.Building;
				Status.Show_Info(selected);
				if(!selected.Active)return;
				if(selected.Owner!=game.Active_Player()||selected.Owner!=game.Client_Player())
				{
					if(_____danger.length>0)
					{
						self.UNHIGHLIGHT(_____danger);
						_____danger = self.HIGHLIGHT();
					}
					return;
				}
				selected.Act();
			}
			else Status.Show_Info(selected);
			return;
		}

		// everything that gets here -> selecting a unit for the first time
		if(check_unit.Alpha.data==0)return;
		if(check_unit.Source==13)return;
		selected_unit = check_unit;
		selected_unit.Start_Path(x, y);
		selected_unit.Open_Selection();
		hl_path = selected_unit.Current_Path();
		highlight_path(hl_path);
		if(selected_unit.Slow_Attack)
			highlight_both(hl_path);
		Status.Show_Info(selected_unit);
		if(selected_unit.Idle||!selected_unit.Active)
		{
			selected_unit.Close_Selection();
			selected_unit = null;
			if(_____danger.length>0)
			{
				self.UNHIGHLIGHT(_____danger);
				_____danger = self.HIGHLIGHT();
			}
			return;
		}
		if(selected_unit.Player!=game.Active_Player()||selected_unit.Player!=game.Client_Player())
		{
			selected_unit.Close_Selection();
			selected_unit = null;
			if(_____danger.length>0)
			{
				self.UNHIGHLIGHT(_____danger);
				_____danger = self.HIGHLIGHT();
			}
			return;
		}
		selected_unit.Mover = new Move_Class(selected_unit,x,y,game.Terrain_Map,moverRender);
	};
};

var Fast_Fake_Interface = {
	Fake:true,
	Draw:function(){},
	End_Game:function(){},
	Simple_Draw:function(){},
	Scroll_To_Tile:function(){},
	Resource_Draw:function(){},
	Set_Unit_Focus:function(){},
	Warn_Hurry:function(){}
};
