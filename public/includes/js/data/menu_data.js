/// Code written and created by Elijah Storm
// Copywrite April 5, 2020
// for use only in ThunderLite Project


Menu.Button = [	"#056937",	"#08AF5C",	"#726962",	"#FFB200",	"#4B5148",	"#FDF5BF",	"#5B74FF"];
				// back	 	// hover	// shadow	// text		// idle		// active	// act.txt

/*** Map Editor ***/
let MapEditorClass = function() {
	let initalized = false;

	function Allowed(_tile) {
		if(ACTIVE_TYPE==TYPES.UNIT)
		{
			if(ACTIVE_PLAYER==-1)return false;
			var _unit = Char_Data.CHARS[ACTIVE_INDEX];
			var _ter = Terrain_Data.TERRE[map_list[_tile]];
			if(_ter.Type==7)	// units cannot exist on impassable terrain
				return false;
			if(_ter.Type==6)	// ground units cannot traverse sea terrain
			if(_unit.Type==0)
				return false;
			if(_ter.Type==2)	// only foot units can climb rugged terrain
			if(_unit.Move_Type==1 || _unit.Move_Type==2)
				return false;
			if(_ter.Type!=6)	// sea units cannot traverse ground terrain
			if(_unit.Type==2)
				return false;
		}
		else if(ACTIVE_TYPE==TYPES.CITY)
		{
			var _city = Building_Data.PLACE[ACTIVE_INDEX];
			var _ter = Terrain_Data.TERRE[map_list[_tile]];
			if(_ter.Type==7)	// cities cannot be on impassable terrain
				return false;
			if(_ter.Type==2)	// cities cannot be on rugged terrain
				return false;
			if(_ter.Type==6)	// ground cities can't exist on sea terrain
			if(_city.Terrain==0)
				return false;
			if(_ter.Type!=6)	// sea cities can't exist on ground terrain
			if(_city.Terrain==2)
				return false;
		}
		else if(ACTIVE_TYPE==TYPES.TERRAIN)
		{
			var _ter = Terrain_Data.TERRE[ACTIVE_INDEX];

			if(Terrain_Data.Get("Shore")==ACTIVE_INDEX)
			{			// connections must be near at least one ground and one sea type
				var ground = false,
					sea = false,
					ter_check;
				if(_tile<map_list.length)
				{
					ter_check = Terrain_Data.TERRE[map_list[_tile+1]];
					if(ter_check.Type==6)
						sea = true;
					else if(ter_check.Type<6 && ter_check.Type>=0)
						ground = true;
				}
				if(_tile>0)
				{
					ter_check = Terrain_Data.TERRE[map_list[_tile-1]];
					if(ter_check.Type==6)
						sea = true;
					else if(ter_check.Type<6 && ter_check.Type>=0)
						ground = true;
				}
				if(_tile+height<map_list.length)
				{
					ter_check = Terrain_Data.TERRE[map_list[_tile+height]];
					if(ter_check.Type==6)
						sea = true;
					else if(ter_check.Type<6 && ter_check.Type>=0)
						ground = true;
				}
				if(_tile-height>0)
				{
					ter_check = Terrain_Data.TERRE[map_list[_tile-height]];
					if(ter_check.Type==6)
						sea = true;
					else if(ter_check.Type<6 && ter_check.Type>=0)
						ground = true;
				}
				return (ground && sea);
			}
			if(_ter.Type==6)
			{
				if(Terrain_Data.Get("Sea")!=ACTIVE_INDEX)
				{		// sea interior cannot be placed near sea border
					if(_tile<map_list.length)
					if(Terrain_Data.TERRE[map_list[_tile+1]].Type!=6)
						return false;
					if(_tile>0)
					if(Terrain_Data.TERRE[map_list[_tile-1]].Type!=6)
						return false;
					if(_tile+height<map_list.length)
					if(Terrain_Data.TERRE[map_list[_tile+height]].Type!=6)
						return false;
					if(_tile-height>0)
					if(Terrain_Data.TERRE[map_list[_tile-height]].Type!=6)
						return false;
				}
			}
			else if(_ter.Type==8)
			{			// connections must be near at least one ground and one sea type
				var ground = false,
					sea = false,
					ter_check;
				if(_tile<map_list.length)
				{
					ter_check = Terrain_Data.TERRE[map_list[_tile+1]];
					if(ter_check.Type==6)
						sea = true;
					else if(ter_check.Type<6 && ter_check.Type>=0)
						ground = true;
				}
				if(_tile>0)
				{
					ter_check = Terrain_Data.TERRE[map_list[_tile-1]];
					if(ter_check.Type==6)
						sea = true;
					else if(ter_check.Type<6 && ter_check.Type>=0)
						ground = true;
				}
				if(_tile+height<map_list.length)
				{
					ter_check = Terrain_Data.TERRE[map_list[_tile+height]];
					if(ter_check.Type==6)
						sea = true;
					else if(ter_check.Type<6 && ter_check.Type>=0)
						ground = true;
				}
				if(_tile-height>0)
				{
					ter_check = Terrain_Data.TERRE[map_list[_tile-height]];
					if(ter_check.Type==6)
						sea = true;
					else if(ter_check.Type<6 && ter_check.Type>=0)
						ground = true;
				}
				if(!ground || !sea)
					return false;
			}
		}
		return true;
	};
	let Tile_Array;

	let DATA = {
		id:-1,
		name:"",
		width:10,
		height:10,
		map_list:null,
		max_players:2,
		players:2,
		units:new Array(),
		cities:new Array(),
		weather:new Array(3),
		__script__:""
	};
	let CHOICE = {
		TERRAIN:0,
		UNITS:1,
		CITY:2,
		WEATHER:3
	};
	let SERVER = {
		LOAD:'download',
		SAVE:'update',
		PLAYTEST:'mark playtested',
		DELETE:'delete',
		PUBLISH:'publish',
		data_saved:false,
		beaten_game:false,
		local_saved_map:-1,
		new_map:true,
		Report_List:function(){},
		onReportGameList:function(fnc)
		{
			SERVER.Report_List = fnc;
		}
	};
	let TYPE = CHOICE.TERRAIN;
	let SELECTION = 0;
	let PAGE = 0;
	let BLANK = BLANKIMG.Source();
	let SFX = SFXs.Retrieve("editor sheet");

	function send_map_data_to_server(type, data) {
		if(!online)return;
		if(SERVER.new_map && type=='update')
			type = 'upload';

		socket.emit('mapdata '+type, socket.password, data);
	}
	function display_server_saved_maps(fnc1, fnc2, fnc3) {
		let _read_game_data = new Array(9),
			_data_text = new Array(9),
			_game_imgs = new Array(9);
		if(fnc1==null) {
			fnc1 = function(_load){
				if(!confirm("This will delete the map "+_read_game_data[_load].Name+".\n\nDelete and Replace?"))return;

				SERVER.local_saved_map = _load;

				while(DATA.name=="" || DATA.name==null || DATA.name=="Unnamed Custom Map")
					DATA.name = prompt("Give your map a name", DATA.name);
				if(DATA.name==null)
					return;

				send_map_data_to_server(SERVER.DELETE, _read_game_data[_load].id);

				setTimeout(function(){
					send_map_data_to_server(SERVER.SAVE, {
						index:DATA.id==-1 ? SERVER.local_saved_map : DATA.id,
						name:DATA.name,
						map:encrypt_game_data(map_data_to_str())
					});
				}, 500);
				SERVER.data_saved = true;
			};
		}
		if(fnc2==null) {
			fnc2 = function(_new){
				SERVER.local_saved_map = _new;

				while(DATA.name=="" || DATA.name==null || DATA.name=="Unnamed Custom Map")
					DATA.name = prompt("Give your map a name", DATA.name);
				if(DATA.name==null)
					return;

				send_map_data_to_server(SERVER.SAVE, {
					index:DATA.id==-1 ? SERVER.local_saved_map : DATA.id,
					name:DATA.name,
					map:encrypt_game_data(map_data_to_str())
				});
				DATA.data_saved = true;
			};
		}

		SERVER.onReportGameList(function(_list_data){
				/// start load maps
			for(let _m in _list_data)
			{
				try {
					let curMap = _list_data[_m];
					var index = curMap.saveindex;
					_data_text[index] = decrypt_game_data(curMap.map);
					_read_game_data[index] = Map_Reader.String(_data_text[index]);
					_read_game_data[index].id = curMap.map_id;
					_read_game_data[index].uploaded = curMap.uploaded;

					if(_read_game_data[index].Valid)
					{
						setTimeout(function(index){
							var sampledGame = new Engine_Class(_read_game_data[index], true);
							sampledGame.Set_Interface(INTERFACE);
							sampledGame.FORCE_MERGE_DISPLAY = true;

							let canvas = document.createElement("canvas");
							canvas.width = 600;
							canvas.height = 600;
							let ctx = canvas.getContext("2d");
							Canvas.ScaleImageData(ctx, INTERFACE.Get_Sample(sampledGame), 0, 0, 10/sampledGame.Terrain_Map.Width, 10/sampledGame.Terrain_Map.Height);

							_game_imgs[index].src = canvas.toDataURL("image/png");
							sampledGame.End_Game();
						}, 5, index);
					}
				} catch (e) {
					_read_game_data[index] = null;
					console.error(e);
				}
			}

			let container = document.getElementById("e-p-content"),
				casing, img, uploaded, delete_btn;
			for(let i=0;i<container.childNodes.length;)
			{
				container.childNodes[i].remove();
			}

			for(let i=0;i<9;i++)
			{
				casing = document.createElement('div');
				casing.style.width = "25%";
				casing.style.margin = "10px";
				casing.style.display = "inline-block";
				container.appendChild(casing);

				if(_read_game_data[i]!=null)
				{	// image display
					_game_imgs[i] = document.createElement('img');
					_game_imgs[i].onclick = function() {
						self.Open(i, _read_game_data[i]);
					};
					delete_btn = document.createElement('img');
					delete_btn.onclick = function() {
						if(!confirm("Do you really want to delete "+_read_game_data[i].Name+"?"))return;
						send_map_data_to_server(SERVER.DELETE, _read_game_data[i].id);
					};
					casing.appendChild(delete_btn);
				}
				else
				{	// empty new game here
					_game_imgs[i] = document.createElement('div');
					_game_imgs[i].onclick = function() {
						self.Open(i);
					};
				}
				_game_imgs[i].style.maxWidth = "100%";
				_game_imgs[i].innerHTML = '<i class="fas fa-plus-square"></i>';
				_game_imgs[i].style.height = "100%";
				_game_imgs[i].style.backgroundColor = "aqua";
				_game_imgs[i].style.borderRadius = "5px";
				casing.appendChild(_game_imgs[i]);
			}
		});

		send_map_data_to_server(SERVER.LOAD);
		document.getElementById("editor-popup").style.display = "block";
	}
	function map_data_to_str() {
		var str = ""+DATA.id+";";
		str+=DATA.name+";";
		str+=DATA.width+";";
		str+=DATA.height+";";
		for(var i=0;i<DATA.map_list.length;i++)
		str+=DATA.map_list[i]+":";
		str+=";";
		for(var i=0;i<DATA.max_players;i++)
		str+=DATA.players[i]+":";
		str+=";";
		for(var i=0;i<DATA.units.length;i++)
		str+=DATA.units[i]+":";
		str+=";";
		for(var i=0;i<DATA.cities.length;i++)
		str+=DATA.cities[i]+":";
		str+=";";
		str+=(DATA.weather[0] ? "1" : "0");
		for(let j=1;j<DATA.weather.length;j++)
		{
			str+=""+DATA.weather[j][0]+""+DATA.weather[j][1]+"-"+DATA.weather[j][2]+":";
		}
		str+=";";

		return str+DATA.__script__+";";
	}
	this.Server_Response = {
		Map_List:function(data)
		{
			SERVER.Report_List(data);
		},
		Report_Id:function(data)
		{
			SERVER.new_map = false;
			id = data;
		},
		Updated_With_Server:function(value)
		{
			data_saved = value;
		}
	};

	let MUSIC_CHANGING = false;
	function Change_Music(change) {
		if(MUSIC_CHANGING)return;
		MUSIC_CHANGING = true;
		MUSIC = MUSIC.Switch(Music.Retrieve("editor "+change), 3000);
		setTimeout(function(){
			MUSIC_CHANGING = false;
		}, 3000);
	}
	function Play_Placement_SFX() {
		SFX.Play_Out(Math.floor(Math.random()*(SFX.Sprite_Amount())));
	}
	function refreshChoiceImages() {
		let image_list;
		if(TYPE==CHOICE.TERRAIN)
		 	image_list = Terrain_Data.TERRE;
		else if(TYPE==CHOICE.UNITS)
		 	image_list = Char_Data.CHARS;
		else if(TYPE==CHOICE.WEATHER)
			image_list = Weather_Data.WEATHER;
		else if(TYPE==CHOICE.CITY)
		{
			image_list = Building_Data.PLACE;
			for (let i = 1; i < 11; i++) {
				if(image_list[i+(10*PAGE)]==null)
					document.getElementById("editor-selection" + (i) + "img").src = BLANK;
				else document.getElementById("editor-selection" + (i) + "img").src =
					image_list[i+(10*PAGE)].Sprite.Source();
			}
			return;
		}
		for (let i = 1; i < 11; i++) {
			if(image_list[i+(10*PAGE)]==null)
				document.getElementById("editor-selection" + (i) + "img").src = BLANK;
			else document.getElementById("editor-selection" + (i) + "img").src =
				image_list[i+(10*PAGE)].Sprite[0].Source();
		}
	}
	function CHANGECHOICE(changeTo) {
		if(changeTo==CHOICE.TERRAIN)
		{
			TYPE = CHOICE.TERRAIN;
			refreshChoiceImages();
		}
		else if(changeTo==CHOICE.UNITS)
		{
			TYPE = CHOICE.UNITS;
			refreshChoiceImages();
		}
		else if(changeTo==CHOICE.CITY)
		{
			TYPE = CHOICE.CITY;
			refreshChoiceImages();
		}
		else if(changeTo==CHOICE.WEATHER)
		{
			TYPE = CHOICE.WEATHER;
			refreshChoiceImages();
		}
		else if(changeTo==CHOICE.ERASE)
			TYPE = CHOICE.ERASE;
	}
	function CHOOSEINDEX(index) {
		if(document.getElementById("editor-selection" + (index) + "img").src==BLANK)
			return;
		document.getElementById("editor-selection" + SELECTION).className = "w3-col editor-selections";
		SELECTION = index;
		document.getElementById("editor-selection" + SELECTION).className += " editor-selected";
	}
	function SELECT(tile) {
		var _x = Math.floor(tile/DATA.height);
		var _y = tile%DATA.height;

		if(!Allowed(tile))
		{

			return;
		}

		SERVER.data_saved = false;
		SERVER.beaten_game = false;

		let INDEX = PAGE*10+SELECTION;
		if(TYPE==CHOICE.TERRAIN)
		{
			if(SELECTION==0){
				document.getElementById("editor-tile"+tile+"img").src = Terrain_Data.TERRE[1].Sprite[0].Source();
			} else {
				document.getElementById("editor-tile"+tile+"img").src = Terrain_Data.TERRE[INDEX].Sprite[0].Source();
					DATA.map_list[tile] = INDEX;
					var _ter = Terrain_Data.TERRE[INDEX];
					for(var j in DATA.cities)
					{
						if(DATA.cities[j][1]==_x && DATA.cities[j][2]==_y)
						{
							var _city = Building_Data.PLACE[DATA.cities[j][0]];
							if(_ter.Type==0)
							if(_city.Terrain==2)
							{
								DATA.cities.splice(j, 1);
								break;
							}
							if(_ter.Type==6)
							if(_city.Terrain==0)
							{
								DATA.cities.splice(j, 1);
								break;
							}
							break;
						}
					}
					for(var j in units)
					{
						if(DATA.units[j][1]==_x && DATA.units[j][2]==_y)
						{
							var _unit = Char_Data.CHARS[DATA.units[j][0]];
							if(_ter.Type==0)
							if(_unit.Move_Type==6 || _unit.Move_Type==7)
							{
								DATA.units.splice(j, 1);
								break;
							}
							if(_ter.Type==6)
							if(_unit.Move_Type==0 || _unit.Move_Type==1 || _unit.Move_Type==2)
							{
								DATA.units.splice(j, 1);
								break;
							}
							break;
						}
					}

					let _wateramt = 49;
					for(let i=0;i<DATA.map_list.length;i++)
					{
						if(DATA.map_list[i]>=12)
						{
							_wateramt++;
						}
					}
					if(_wateramt>=DATA.width*DATA.height/2)
					{
						if(MUSIC.Name().includes("plains"))
						{
							Change_Music("water");
						}
					}
					else
					{
						if(MUSIC.Name().includes("water"))
						{
							Change_Music("plains");
						}
					}
			}
		}
		else if(TYPE==CHOICE.UNITS)
		{
			if(SELECTION==0) {
				document.getElementById("editor-tile"+tile+"imgUNI").src = BLANK;
			} else {
				document.getElementById("editor-tile"+tile+"imgUNI").src = Char_Data.CHARS[INDEX].Sprite[0].Source();
				var found = false;
				for(var j in DATA.units)
				{
					if(DATA.units[j][1]==_x && DATA.units[j][2]==_y)
					{
						DATA.units[j][0] = INDEX;
						DATA.units[j][3] = ACTIVE_PLAYER;
						found = true;
						break;
					}
				}
				if(!found)
				{
					DATA.units.push([INDEX, _x, _y, ACTIVE_PLAYER]);
				}
			}
		}
		else if(TYPE==CHOICE.CITY)
		{
			if(SELECTION==0) {
				document.getElementById("editor-tile"+tile+"imgBUI").src = BLANK;
			} else {
				document.getElementById("editor-tile"+tile+"imgBUI").src = Building_Data.PLACE[INDEX].Sprite.Source();
				var found = false;
				for(var j in DATA.cities)
				{
					if(DATA.cities[j][1]==_x && DATA.cities[j][2]==_y)
					{
						DATA.cities[j][0] = INDEX;
						DATA.cities[j][3] = ACTIVE_PLAYER;
						found = true;
						break;
					}
				}
				if(!found)
				{
					DATA.cities.push([INDEX, _x, _y, ACTIVE_PLAYER]);
				}
			}
		}
		else if(TYPE==CHOICE.WEATHER)
		{
			if(SELECTION==0) {
				document.getElementById("editor-tile"+tile+"imgWEA").src = BLANK;
			} else {
				document.getElementById("editor-tile"+tile+"imgWEA").src = Weather_Data.WEATHER[INDEX].Sprite[0].Source();
			}
		}

		Play_Placement_SFX();
	}

	this.Save = function() {
		if(SERVER.data_saved)return;

		if(SERVER.local_saved_map==-1)
		{	// ask to save, because user created a map before saving
			display_server_saved_maps();
			return;
		}

		while(DATA.name=="" || DATA.name==null || DATA.name=="Unnamed Custom Map" || DATA.name.includes(";"))
			DATA.name = prompt("Give your map a name", DATA.name);
		if(DATA.name==null)
			return;

		send_map_data_to_server(SERVER.SAVE, {
			index:DATA.id==-1 ? SERVER.local_saved_map : DATA.id,
			name:DATA.name,
			map:encrypt_game_data(map_data_to_str())
		});
		SERVER.data_saved = true;
	};
	this.Load = function() {
		display_server_saved_maps();
	};
	this.Test = function() {
		let each_player = new Array(DATA.max_players);
		for(let i=0;i<each_player.length;i++)
			each_player[i] = false;
		for(let i in DATA.units)
			each_player[DATA.units[i][3]] = true;
		for(let i in each_player)
		{
			if(!each_player[i])
			{
				LOG.popup("Each player must have at least one unit to Test.", "#f00",3000);
				return;
			}
		}
		// all players have to have at least one unit to play

		if(SERVER.local_saved_map==-1)
		{	// ask to save, because user created a map before saving
			display_server_saved_maps();
			return;
		}

		new_custom_game(map_data_to_str(), [DATA.name], true, SERVER.local_saved_map, 1);
	};
	this.Options = function() {

	};
	this.Upload = function() {
		if(!SERVER.beaten_game)return;
		if(!SERVER.data_saved)return;

		send_map_data_to_server(SERVER.PUBLISH, DATA.id);
		LOG.popup("Successfully uploaded.");
	};
	this.Page_Left = function() {
		if(PAGE==0)
			return;
		PAGE--;
		refreshChoiceImages();
	};
	this.Page_Right = function() {
		if(TYPE==CHOICE.TERRAIN)
		{
			if(PAGE*10+11>=Terrain_Data.TERRE.length)
				return;
		}
		else if(TYPE==CHOICE.UNITS)
		{
			if(PAGE*10+11>=Char_Data.CHARS.length)
				return;
		}
		else if(TYPE==CHOICE.CITY)
		{
			if(PAGE*10+11>=Building_Data.PLACE.length)
				return;
		}
		else if(TYPE==CHOICE.WEATHER)
		{
			if(PAGE*10+11>=Weather_Data.WEATHER.length)
				return;
		}
		PAGE++;
		refreshChoiceImages();
	};
	this.Choose = function(choice) {
		PAGE = 0;
		CHANGECHOICE(choice);
	};

	this.Init = function() {
		if(initalized)return;
		initalized = true;
		let tileHolder = document.getElementById('editor-tile-holder');
		for(let i=0;i<tileHolder.childNodes.length;)
			tileHolder.childNodes[0].remove();
		let tile, img, index = -1;
		for(let x=0;x<10;x++)
		{
			for(let y=0;y<10;y++)
			{
				tile = document.createElement('div');
				tile.className = "w3-col editor-tile";
				tile.id = "editor-tile" + (++index);
				tile.onclick = function() {
					SELECT(parseInt(this.id.split("editor-tile")[1]));
				};

				img = document.createElement('img');
				img.className = "editor-tile-ter";
				img.id = "editor-tile" + (index) + "img";
				img.src = Terrain_Data.TERRE[1].Sprite[0].Source();

				tile.appendChild(img);

				img = document.createElement('img');
				img.className = "editor-tile-img";
				img.id = "editor-tile" + (index) + "imgBUI";
				img.src = BLANK;

				tile.appendChild(img);

				img = document.createElement('img');
				img.className = "editor-tile-img";
				img.id = "editor-tile" + (index) + "imgUNI";
				img.src = BLANK;

				tile.appendChild(img);

				img = document.createElement('img');
				img.className = "editor-tile-img";
				img.id = "editor-tile" + (index) + "imgWEA";
				img.src = BLANK;

				tile.appendChild(img);
				tileHolder.appendChild(tile);
			}
		}

		let selectionHolder = document.getElementById('editor-selction-holder');
		let selection;
		for(index=1;index<11;index++)
		{
			selection = document.createElement('div');
			selection.className = "w3-col editor-selections";
			selection.style.width = "50px";
			selection.id = "editor-selection" + (index);
			selection.onclick = function() {
				CHOOSEINDEX(parseInt(this.id.split("editor-selection")[1]));
			};

			img = document.createElement('img');
			img.id = "editor-selection" + (index) + "img";
			img.className = "editor-selections-img";
			img.style.maxHeight = "44px";
			img.src = Terrain_Data.TERRE[index].Sprite[0].Source();

			selection.appendChild(img);
			selectionHolder.appendChild(selection);
		}

		index = 0;
		selection = document.createElement('div');
		selection.className = "w3-col editor-selections";
		selection.style.width = "50px";
		selection.id = "editor-selection" + (index);
		selection.onclick = function() {
			CHOOSEINDEX(parseInt(this.id.split("editor-selection")[1]));
		};

		img = document.createElement('i');
		img.id = "editor-selection" + (index) + "img";
		img.className = "editor-selections-img";
		img.style.fontSize = "200%";
		img.className = "fas fa-eraser";

		selection.appendChild(img);
		selectionHolder.appendChild(selection);

		index = 11;
		selection = document.createElement('div');
		selection.className = "w3-col editor-selections";
		selection.style.width = "50px";
		selection.id = "editor-selection" + (index);
		selection.onclick = function() {
			CHOOSEINDEX(parseInt(this.id.split("editor-selection")[1]));
		};

		img = document.createElement('i');
		img.id = "editor-selection" + (index) + "img";
		img.className = "editor-selections-img";
		img.style.fontSize = "200%";
		img.className = "fas fa-question";

		selection.appendChild(img);
		selectionHolder.appendChild(selection);

		CHOOSEINDEX(1);
	};
	this.Open = function(save_data_index, game_data, tested_complete) {
		if(tested_complete)
		{
			send_map_data_to_server(SERVER.PLAYTEST, game_data.id);
			SERVER.beaten_game = true;
			SERVER.data_saved = true;
		}

		ACTIVE_INDEX = 1;
		ACTIVE_PLAYER = 0;
		ACTIVE_TYPE = 0;
		OLD_TYPE = 1;
		SERVER.local_saved_map = (save_data_index==null) ? -1 : save_data_index;
		DATA.units = new Array();
		DATA.cities = new Array();
		DATA.name = "Unnamed Custom Map";
		DATA.players = ["Red","Blue","Green","Yellow"];
		DATA.max_players = 2;
		DATA.id = -1;

		if(game_data==null || !game_data.Valid)
		{
			DATA.map_list = null;
			// Map_Size(10, 10);
			// Update_Active_List(TYPES.TERRAIN);
			SERVER.new_map = true;
			return;
		}
		SERVER.new_map = false;

		var data = game_data.Data.Get();
		DATA.id = game_data.id;
		DATA.name = data.name;
		DATA.width = data.t_width;
		DATA.height = data.t_height;

		// Map_Size(width, height);
		DATA.map_list = new Array(width*height);
		for(let x=0,i=0;x<DATA.width;x++)
		for(let y=0;y<DATA.height;y++)
		DATA.map_list[i++] = data.terrain[x][y];

		DATA.players = data.p_list;
		DATA.max_players = DATA.players.length;
		DATA.units = data.u_list;
		DATA.cities = data.c_list;
		DATA.weather = data.w_data;
		DATA.__script__ = data.__script;

		CHANGECHOICE(CHOICE.TERRAIN);
	};
};
var Map_Editor = new MapEditorClass;





Menu.MapEditor = new Menu.Menu_Class("#7F9172");
Menu.MapEditor.Open = function()
{
	Animations.Retrieve("Load").Remove_All();
	with(Menu.MapEditor){

		function open_script_editor()
		{
			POPUP_ADDER();									// declare popup about to be used

			/// SETUP background and box

			POPUP_ADDER(new Canvas.Drawable(Shape.Rectangle, null, -10, -10, 900, 900, "#333", null, .7), function(){});
			POPUP_ADDER(new Canvas.Drawable(Shape.Rectangle, null, 50, 25, 700, 600, "#777", null, .75), function(){});
			POPUP_ADDER(new Canvas.Drawable(Shape.Rectangle, null, 50, 25, 700, 30, "#999", null, .5));
			POPUP_ADDER(new Canvas.Drawable(new Text_Class("20pt Verdana", "#fff"), null, 60, 30, 400, 30, "Script Editor"));
			POPUP_ADDER(new Canvas.Drawable(Shape.Rectangle, null, 725, 30, 20, 20, "#F49097"), POPUP_CLOSER);
			POPUP_ADDER(new Canvas.Drawable(new Text_Class("15pt Verdana", "#fff"), null, 727, 32, 20, 18, "X"), POPUP_CLOSER);

			var doc = new Document(__script__),
          editor = new CanvasTextEditor(doc, {width:645, height:480, left:70, top:100});

      document.getElementById('inputHandler').appendChild(editor.getEl());
			editor.getEl().id = "canvasScriptInput";

			let learnMoreLink = document.createElement('a');
			learnMoreLink.href = "/about/script";
			learnMoreLink.innerHTML = "Learn ThunderLite scripting";
			learnMoreLink.target = "_blank";
			learnMoreLink.id = "learnScriptLink";
			learnMoreLink.style.color = "#28C5D3";
			learnMoreLink.style.position = "absolute";
			learnMoreLink.style.left = "500px";
			learnMoreLink.style.top = "600px";
			document.getElementById('inputHandler').appendChild(learnMoreLink);

			Menu.MapEditor.Current_Scale = function(x, y)
			{
				learnMoreLink.style.left = (500*x)+"px";
				learnMoreLink.style.top = (600*x)+"px";
				editor.reflow(x, y);
			};

			Menu.MapEditor.Current_Scale(Menu.MapEditor.xScale, Menu.MapEditor.yScale);
      editor.focus();

			Menu.MapEditor.Script = editor;

			function scriptIsValid(_script){
				if(_script.charAt(0)=='.')
				{	// test error
					return 10;
				}
				return 0;
			}
			function save_fnc()
			{
				let err = scriptIsValid(editor._document.storage[0]);
				if(err!=0)
				{
					console.error("Invalid game script",err);
					return;
				}
				__script__ = "";
				for(let i=0;i<editor._document.storage.length;i++)
					__script__+=editor._document.storage[i];
				data_saved = false;

				Draw();
			}
			POPUP_ADDER(new Canvas.Drawable(Images.Retrieve("Close"), null, 100, 65, 25, 25, "Erase"), function()
			{
				POPUP_CLOSER();
				Draw();
			});
			POPUP_ADDER(new Canvas.Drawable(Images.Retrieve("Save"), null, 175, 65, 25, 25, "SAVE"), save_fnc);
			editor.save = save_fnc;

		}
		function open_weather_editor()
		{
			POPUP_ADDER();									// declare popup about to be used

			/// SETUP background and box

			POPUP_ADDER(new Canvas.Drawable(Shape.Rectangle, null, -10, -10, 900, 900, "#333", null, .7));
			POPUP_ADDER(new Canvas.Drawable(Shape.Rectangle, null, 50, 25, 700, 600, "#777", null, .75), function(){
				Draw();
				return false;
			});
			POPUP_ADDER(new Canvas.Drawable(Shape.Rectangle, null, 50, 25, 700, 30, "#999", null, .5));
			POPUP_ADDER(new Canvas.Drawable(new Text_Class("20pt Verdana", "#fff"), null, 60, 30, 400, 30, "Weather Editor"));
			POPUP_ADDER(new Canvas.Drawable(Shape.Rectangle, null, 725, 30, 20, 20, "#F49097"), POPUP_CLOSER);
			POPUP_ADDER(new Canvas.Drawable(new Text_Class("15pt Verdana", "#fff"), null, 727, 32, 20, 18, "X"), POPUP_CLOSER);

			let pallette = ["#EFCA8B", "#8BAFED", "#8AD7EA", "#E88888"];
			let __weather = [Images.Retrieve("Sunny Icon"), Images.Retrieve("Rainy Icon"), Images.Retrieve("Snowy Icon"), Images.Retrieve("Heat Icon")];
			let turn = weather.length-1;
			const static_rate = 10;
			let __weather_pie_data = new Array(turn), __cur_data = new Array(turn);
			let __start_turn = 0;

			if(turn==0)
			{
				turn = 1;
				__cur_data.push(0);
			}
			else
			{
				for(let i=0;i<turn;i++)
				{
					__cur_data[i] = weather[i+1][0];
				}
			}

			function updateWeather()
			{
				for(let i=0;i<turn;i++)
				{
					__weather_pie_data[i] = [static_rate, pallette[__cur_data[i]], __weather[__cur_data[i]]];
				}
			}

			function sendPatternToData()
			{
				weather = [weather[0]];
				for(let i=0;i<turn;i++)
				{
					weather.push([__cur_data[i], __start_turn+i, turn]);
				}
				data_saved = false;
				POPUP_CLOSER();
				Draw();
			}

			POPUP_ADDER(new Canvas.Drawable(Images.Retrieve("Erase"), null, 100, 80, 50, 50, "Erase"), function()
			{
				if(turn<=1)return;
				turn--;
				__weather_pie_data.pop();
				__cur_data.pop();
				Draw();
			});
			POPUP_ADDER(new Canvas.Drawable(Images.Retrieve("Save"), null, 175, 80, 50, 50, "SAVE"), function()
			{
				sendPatternToData();
			});

			for(let i=0;i<Weather_Data.Global_Amount;i++)
			{
				POPUP_ADDER(new Canvas.Drawable({
					Draw:function(c,x,y,w,h,s)
					{
						Weather_Data.Get_Global(s).Icon.Draw(c,x,y,w,h);
						// new Text_Class("15pt Verdana", "#fff").Draw(c,x,y,w,h,);
					}
				}, null, 410+(i*75), 80, 50, 50, i), function()
				{
					if(turn>=12)return;
					turn++;
					__cur_data.push(i);
					updateWeather();
					Draw();
				});
			}

			updateWeather();
			POPUP_ADDER(new Canvas.Drawable(Shape.Pie, null, 175, 150, 400, 400, __weather_pie_data));

		}




		var MAP_OPTION_ADDER = function(){
			POPUP_ADDER();									// declare popup about to be used

			/// SETUP background and box

			POPUP_ADDER(new Canvas.Drawable(Shape.Rectangle, null, 150, 125, 400, 300, "#777", null, .75), function(){
				Draw();
				return false;
			});
			POPUP_ADDER(new Canvas.Drawable(Shape.Rectangle, null, 150, 125, 400, 30, "#999", null, .5));
			POPUP_ADDER(new Canvas.Drawable(new Text_Class("20pt Verdana", "#fff"), null, 160, 130, 400, 30, "Map and Game Options"));
			POPUP_ADDER(new Canvas.Drawable(Shape.Rectangle, null, 525, 130, 20, 20, "#F49097"), POPUP_CLOSER);
			POPUP_ADDER(new Canvas.Drawable(new Text_Class("15pt Verdana", "#fff"), null, 527, 132, 20, 18, "X"), POPUP_CLOSER);

			/// 1) make special conditions
			/// 2) limit units that can be built



			/// 3) add script options

			POPUP_ADDER(new Canvas.Drawable(new Text_Class("15pt Verdana", "#fff"), null, 175, 190, 130, 25, "Script Editor"));
			POPUP_ADDER(new Canvas.Drawable({							// script addor
				Draw:function(c, x, y, w, h, s){
					Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[0]);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x+12,y+3,260,20,s);
				}
			}, null, 190, 215, 85, 25, "Open"), function(text){
				POPUP_CLOSER();
				open_script_editor();
				Draw();
			});


			/// 4) fog of war option

			POPUP_ADDER(new Canvas.Drawable(new Text_Class("15pt Verdana", "#fff"), null, 182, 250, 130, 25, "Fog of War"));
			POPUP_ADDER(new Canvas.Drawable({							// toggle on and off
				Draw:function(c, x, y, w, h,value){
					Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[0]);
					var text = (value[0]) ? "On" : "Off";;
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x+27,y+5,260,20,text);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x+26,y+4,260,20,text);
				}
			}, null, 190, 270, 85, 25, weather), function(text){
				weather[0] = (weather[0]) ? false : true;
				data_saved = false;
				Draw();
			});


			/// 5) weather changes

			POPUP_ADDER(new Canvas.Drawable(new Text_Class("15pt Verdana", "#fff"), null, 420, 190, 130, 25, "Weather"));
			POPUP_ADDER(new Canvas.Drawable({							// weather changes
				Draw:function(c, x, y, w, h, s){
					Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[0]);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x+12,y+3,260,20,s);
				}
			}, null, 425, 215, 85, 25, "Open"), function(text){
				POPUP_CLOSER();
				open_weather_editor();
				Draw();
			});


			/// 6) max player adjustments

			POPUP_ADDER(new Canvas.Drawable(new Text_Class("15pt Verdana", "#fff"), null, 405, 250, 130, 25, "Total Players"));
			POPUP_ADDER(new Canvas.Drawable({
				Draw:function(c,x,y,w,h,s)
				{
					s.Draw(c,x,y,w,h,""+max_players);
				}
			}, null, 458, 270, 25, 25, new Text_Class("20pt Verdana", "#fff")));
			POPUP_ADDER(new Canvas.Drawable({							// down one player
				Draw:function(c, x, y, w, h, s){
					Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[0]);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x+3,y+4,260,20,"<");
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x+2,y+3,260,20,"<");
				}
			}, null, 425, 270, 25, 25, Player_Text), function(text){
				if(max_players>2)
					max_players--;
				data_saved = false;
				Draw();
			}, {
				Draw:function(c, x, y, w, h, s){
					Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[1]);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x+3,y+4,260,20,"<");
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x+2,y+3,260,20,"<");
				}
			});
			POPUP_ADDER(new Canvas.Drawable({							// up one player
				Draw:function(c, x, y, w, h, s){
					Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[0]);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x+3,y+4,260,20,">");
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x+2,y+3,260,20,">");
				}
			}, null, 485, 270, 25, 25, Player_Text), function(text){
				if(max_players<4)
					max_players++;
				data_saved = false;
				Draw();
			}, {
				Draw:function(c, x, y, w, h, s){
					Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[1]);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x+3,y+4,260,20,">");
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x+2,y+3,260,20,">");
				}
			});


			/// 7) map size change

			POPUP_ADDER(new Canvas.Drawable(new Text_Class("15pt Verdana", "#fff"), null, 185, 310, 150, 20, "Grow Map"));
			POPUP_ADDER(new Canvas.Drawable({				// GROW btn		>
				Draw:function(c, x, y, w, h, s){
					Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[0]);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+5,60,20,s);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+5,60,20,s);
				}
			}, null, 250, 350, 25, 25, ">"), function(){
				POPUP_CLOSER();
				Map_Size(width+1, height, 0, 0);
				MAP_OPTION_ADDER();
				data_saved = false;
				Draw();
			}, {
				Draw:function(c, x, y, w, h, s){
					Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[1]);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+5,60,20,s);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+5,60,20,s);
				}
			});
			POPUP_ADDER(new Canvas.Drawable({				// GROW btn		<
				Draw:function(c, x, y, w, h, s){
					Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[0]);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+5,60,20,s);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+5,60,20,s);
				}
			}, null, 190, 350, 25, 25, "<"), function(){
				POPUP_CLOSER();
				Map_Size(width+1, height, 1, 0);
				MAP_OPTION_ADDER();
				data_saved = false;
				Draw();
			}, {
				Draw:function(c, x, y, w, h, s){
					Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[1]);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+5,60,20,s);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+5,60,20,s);
				}
			});
			POPUP_ADDER(new Canvas.Drawable({				// GROW btn		^
				Draw:function(c, x, y, w, h, s){
					Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[0]);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+5,60,20,s);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+5,60,20,s);
				}
			}, null, 220, 335, 25, 25, "^"), function(){
				POPUP_CLOSER();
				Map_Size(width, height+1, 0, 1);
				MAP_OPTION_ADDER();
				data_saved = false;
				Draw();
			}, {
				Draw:function(c, x, y, w, h, s){
					Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[1]);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+5,60,20,s);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+5,60,20,s);
				}
			});
			POPUP_ADDER(new Canvas.Drawable({				// GROW btn		v
				Draw:function(c, x, y, w, h, s){
					Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[0]);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+5,60,20,s);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+5,60,20,s);
				}
			}, null, 220, 365, 25, 25, "v"), function(){
				POPUP_CLOSER();
				Map_Size(width, height+1, 0, 0);
				MAP_OPTION_ADDER();
				data_saved = false;
				Draw();
			}, {
				Draw:function(c, x, y, w, h, s){
					Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[1]);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+5,60,20,s);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+5,60,20,s);
				}
			});

			POPUP_ADDER(new Canvas.Drawable(new Text_Class("15pt Verdana", "#fff"), null, 420, 310, 150, 20, "Shrink Map"));
			POPUP_ADDER(new Canvas.Drawable({				// SHRINK btn	>
				Draw:function(c, x, y, w, h, s){
					Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[0]);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+5,60,20,s);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+5,60,20,s);
				}
			}, null, 425, 350, 25, 25, ">"), function(){
				POPUP_CLOSER();
				Map_Size(width-1, height, 1, 0);
				MAP_OPTION_ADDER();
				data_saved = false;
				Draw();
			}, {
				Draw:function(c, x, y, w, h, s){
					Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[1]);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+5,60,20,s);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+5,60,20,s);
				}
			});
			POPUP_ADDER(new Canvas.Drawable({				// SHRINK btn	<
				Draw:function(c, x, y, w, h, s){
					Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[0]);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+5,60,20,s);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+5,60,20,s);
				}
			}, null, 485, 350, 25, 25, "<"), function(){
				POPUP_CLOSER();
				Map_Size(width-1, height, 0, 0);
				MAP_OPTION_ADDER();
				data_saved = false;
				Draw();
			}, {
				Draw:function(c, x, y, w, h, s){
					Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[1]);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+5,60,20,s);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+5,60,20,s);
				}
			});
			POPUP_ADDER(new Canvas.Drawable({				// SHRINK btn	^
				Draw:function(c, x, y, w, h, s){
					Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[0]);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+5,60,20,s);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+5,60,20,s);
				}
			}, null, 455, 335, 25, 25, "v"), function(){
				POPUP_CLOSER();
				Map_Size(width, height-1, 0, 1);
				MAP_OPTION_ADDER();
				data_saved = false;
				Draw();
			}, {
				Draw:function(c, x, y, w, h, s){
					Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[1]);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+5,60,20,s);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+5,60,20,s);
				}
			});
			POPUP_ADDER(new Canvas.Drawable({				// SHRINK btn	v
				Draw:function(c, x, y, w, h, s){
					Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[0]);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+5,60,20,s);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+5,60,20,s);
				}
			}, null, 455, 365, 25, 25, "^"), function(){
				POPUP_CLOSER();
				Map_Size(width, height-1, 0, 0);
				MAP_OPTION_ADDER();
				data_saved = false;
				Draw();
			}, {
				Draw:function(c, x, y, w, h, s){
					Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[1]);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+5,60,20,s);
					new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+5,60,20,s);
				}
			});





			// max_players

			Draw();
		};

		function make_map_bigger(new_x, new_y, start_x, start_y)
		{
			var new_list = new Array(new_x*new_y),
				_new = 0,
				_old = 0;

			for(var x=0;x<new_x;x++)
			{
				for(var y=0;y<new_y;y++)
				{
					if((x>=start_x && y>=start_y) && (x<width+start_x && y<height+start_y))
					{
						new_list[_new++] = map_list[_old++];
					}
					else new_list[_new++] = 1;
				}
			}

			width = new_x;
			height = new_y;
			map_list = new_list;

			for(var i in units)
			{
				units[i][1]+=start_x;
				units[i][2]+=start_y;
			}
			for(var i in cities)
			{
				cities[i][1]+=start_x;
				cities[i][2]+=start_y;
			}
		}
		function make_map_smaller(new_x, new_y, start_x, start_y)
		{
			var new_list = new Array(new_x*new_y),
				_new = 0,
				_old = start_x*height+start_y;

			for(var x=0;x<width;x++)
			{
				for(var y=0;y<height;y++)
				{
					if(x>=new_x || y>=new_y)
					{
						_old++;
						continue;
					}
					new_list[_new++] = map_list[_old++];
				}

			}

			width = new_x;
			height = new_y;
			map_list = new_list;

			for(var i=units.length-1;i>=0;i--)
			{
				units[i][1]-=start_x;
				units[i][2]-=start_y;
				if(units[i][1]<0 || units[i][2]<0)
					units.splice(i, 1);
				else if(units[i][1]>=width || units[i][2]>=height)
					units.splice(i, 1);
			}
			for(var i=cities.length-1;i>=0;i--)
			{
				cities[i][1]-=start_x;
				cities[i][2]-=start_y;
				if(cities[i][1]<0 || cities[i][2]<0)
					cities.splice(i, 1);
				else if(cities[i][1]>=width || cities[i][2]>=height)
					cities.splice(i, 1);
			}
		}




		Player_Text = new Canvas.Drawable({
			Draw:function(c,x,y,w,h,s){
				if(s==0)
					new Text_Class("18pt Verdana", "#F5E4D7").Draw(c,x-5,y+6,w,h,"Idle");
				else new Text_Class("18pt Verdana", "#F5E4D7").Draw(c,x-5,y+6,w,h,"Team "+s);
				Team_Colors.Draw(c,x+80,y+17,h-17,{
					Color:s
				});
			}
		}, null, 650, 145, 150, 30, 1);
		Player_Text.Index = Menu.MapEditor;
		Add(new Canvas.Drawable({							// down one player
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[0]);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+4,260,20,"<");
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+3,260,20,"<");
			}
		}, null, 620, 145, 20, 30, Player_Text), function(text){
			if(ACTIVE_PLAYER>-1)
				ACTIVE_PLAYER--;
			text.State.Set(ACTIVE_PLAYER+1);
		}, {
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[1]);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+4,260,20,"<");
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+3,260,20,"<");
			}
		});
		Add(new Canvas.Drawable({							// up one player
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[0]);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+4,260,20,">");
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+3,260,20,">");
			}
		}, null, 755, 145, 20, 30, Player_Text), function(text){
			if(ACTIVE_PLAYER<max_players-1)
				ACTIVE_PLAYER++;
			text.State.Set(ACTIVE_PLAYER+1);
		}, {
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[1]);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+4,260,20,">");
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+3,260,20,">");
			}
		});
		Add(Player_Text);


		Map_Size = function(_x, _y, start_x, start_y)
		{													// in here puts the tile click controls
			if(_x>30 || _y>30)return;
			if(_x<10 || _y<10)return;

			if(map_list==null)
			{	// make new map
				width = _x;
				height = _y;
				map_list = new Array(width*height);
				for(var i=0;i<map_list.length;i++)
				{
					map_list[i] = 1;
				}
			}
			else
			{	// this is to resize map
				if(VIEW_ACTIVE_LIST[0]>FIRST_MAP_DRAW)
					VIEW_ACTIVE_LIST[0]-=map_list.length+1;

					// delete last buttons
				Remove(FIRST_MAP_DRAW, map_list.length+1);

				if(start_x==null)
					start_x = 0;
				if(start_y==null)
					start_y = 0;
				if(_x>width)
					make_map_bigger(_x, height, start_x, 0);
				if(_x<width)
					make_map_smaller(_x, height, start_x, 0);
				if(_y>height)
					make_map_bigger(width, _y, 0, start_y);
				if(_y<height)
					make_map_smaller(width, _y, 0, start_y);
			}
			x_scale = 600/width;
			y_scale = 600/height;
			ERROR_DISPLAY.Width.Set(x_scale);
			ERROR_DISPLAY.Height.Set(y_scale);

				/// draw map
			for(var x=0,i=0;x<width;x++)
			for(var y=0;y<height;y++)
				Add(new Canvas.Drawable(MAP_DRAWER, Canvas.Merge,
						10+(x_scale*x), 30+(y_scale*y),
						x_scale, y_scale, i++),
					MAP_CLICKER, new Canvas.Drawable(Shape.Rectangle, null,
						10+(x_scale*x), 30+(y_scale*y), x_scale, y_scale,
						"#666607", null, .4));
			FIRST_MAP_DRAW = Add(ERROR_DISPLAY)-(i);
		};

		Menu.MapEditor.New = function(save_data_index, game_data, tested_complete){
			if(tested_complete)
			{
				send_map_data_to_server(SERVER.PLAYTEST, game_data.id);
				beaten_game = true;
				data_saved = true;
			}
			Animations.Retrieve("Load").Remove_All();
			ERROR_DISPLAY.Index = Menu.MapEditor;
			ERROR_DISPLAY.Alpha.Set(0);
			ACTIVE_INDEX = 1;
			ACTIVE_PLAYER = 0;
			ACTIVE_TYPE = 0;
			OLD_TYPE = 1;
			local_saved_map = (save_data_index==null) ? -1 : save_data_index;
			units = new Array();
			cities = new Array();
			name = "Unnamed Custom Map";
			players = ["Red","Blue","Green","Yellow"];
			max_players = 2;
			id = -1;

			if(game_data==null || !game_data.Valid)
			{
				map_list = null;
				Map_Size(10, 10);
				Update_Active_List(TYPES.TERRAIN);
				SERVER.new_map = true;
				return;
			}
			SERVER.new_map = false;

			var data = game_data.Data.Get();
			id = game_data.id;
			name = data.name;
			width = data.t_width;
			height = data.t_height;

			Map_Size(width, height);
			map_list = new Array(width*height);
			for(var x=0,i=0;x<width;x++)
			for(var y=0;y<height;y++)
				map_list[i++] = data.terrain[x][y];

			players = data.p_list;
			max_players = players.length;
			units = data.u_list;
			cities = data.c_list;
			weather = data.w_data;
			__script__ = data.__script;

			Update_Active_List(TYPES.TERRAIN);
		};
	}
};

Menu.MapEditor = null;

/*** In game unit popup, unit double click ***/
Menu.Game_Prompt = new Menu.Menu_Class();

/*** Overlay to stop input ***/
Menu.No_Touch_Overlay = new Menu.Menu_Class("#444C");
Menu.No_Touch_Overlay.Add(new Canvas.Drawable(new Text_Class("20pt Impact", "#FFF"), null, 300, 100, 200, 200, "Input stopped until user reconnects"));
Menu.No_Touch_Overlay.Add(new Canvas.Drawable(new Text_Class("15pt Impact", "#FFF"), null, 300, 300, 200, 200, "If 30 seconds pass, they will forfeit"));

/*** Game Internal Lobby Menu ***/
Menu.PreGame = {};
Menu.PreGame.Slots = [];
Menu.PreGame.AddStarter = function(mapName){
	let START = document.createElement('button');
	START.id = "HOSTGAMESTART";
	START.innerHTML = INTERFACE.Game.Full() ? "Start Game" : "Start with AI";
	START.onclick = function(){
		INTERFACE.Game.Host_Game(socket.game_id);
		START.remove();
	};
	START.className = "w3-button w3-block w3-black w3-margin-bottom";
	document.getElementById("HOSTGAMEBUTTONS").appendChild(START);
};
Menu.PreGame.Set = function(index,value){
	if(index>=this.Slots.length)return;

	document.getElementById("HOSTGAMEPLAYERLIST"+index).innerHTML = value=="" ? "---" : value;
	this.Slots[index] = value;

	if(document.getElementById("HOSTGAMESTART")==null)return;
	document.getElementById("HOSTGAMESTART").innerHTML = INTERFACE.Game.Full() ? "Start Game" : "Start with AI";
};
Menu.PreGame.Leave = function(){
	INTERFACE.Game.Send_Move('leave');
	mainMenu();
	changeContent(CONTENT_REDIRECT);
};
Menu.PreGame.visibleMapID = function(txt){
	if(txt==null)return "";
	if(txt.length!=9)return "";
	return txt.substring(0, 3) + " - " + txt.substring(3, 6) + " - " + txt.substring(6, 9);
};
Menu.PreGame.Setup_Map = function(map){
	if(map==null)return;
	if(!map.Valid)return;

	let playersAmount = map.Player_Amount(),
		__name = map.Name,
		__id = map.id;
	let doc_list = document.getElementById("HOSTGAMEPLAYERS");

	while(doc_list.childNodes.length>0)
	{
		doc_list.removeChild(doc_list.childNodes[0]);
	}

	document.getElementById("HOSTGAMEMAPNAME").innerHTML = "<b>"+__name+"</b>";
	document.getElementById("HOSTGAMEMAPID").innerHTML = Menu.PreGame.visibleMapID(__id);

	this.Slots = new Array(playersAmount);
	let curEl;

	for(var i=0;i<playersAmount;i++)
	{
		curEl = document.createElement('div');
		curEl.id = "HOSTGAMEPLAYERLIST"+i;
		curEl.innerHTML = "&nbsp;";
		curEl.className = "INFO-LIST";
		doc_list.appendChild(curEl);
	}
};


/*** End Game Results Menu ***/
Menu.PostGame = new Menu.Menu_Class("#FFEFD8");
Menu.PostGame.Set = function(map, players, turn, close_func){
	with(Menu.PostGame){
		Erase();
		Add(new Canvas.Drawable(new Text_Class("15pt Impact", "#C48752"), null, 300, 90, 70, 30, (turn+1)+" days"));
		Add(new Canvas.Drawable(new Text_Class("45pt Impact", "#C48752"), null, 81, 38, 600, 45, map));

		var caption_txt = new Text_Class("20pt Verdana", "#000");
		Add(new Canvas.Drawable(caption_txt, null, 160, 120, 70, 30, "name"));
		Add(new Canvas.Drawable(caption_txt, null, 333, 120, 70, 30, "units"));
		Add(new Canvas.Drawable(caption_txt, null, 420, 120, 70, 30, "funds"));
		Add(new Canvas.Drawable(caption_txt, null, 500, 120, 70, 30, "turns"));
		Add(new Canvas.Drawable(caption_txt, null, 580, 120, 200, 30, "damage dealt"));
		Add(new Canvas.Drawable(Shape.Box, null, 60, 143, 700, 399, "#000"));
		for(var i=0;i<players.length;i++){
			var cur = players[i];
			Add(new Canvas.Drawable(caption_txt, null, 22, 170+i*60, 54, 30, ""+(i+1)));
			Add(new Canvas.Drawable(Shape.Box, null, 65, 155+i*60, 690, 50, "#000"));
			Add(new Canvas.Drawable(cur.Icon, null, 80, 160+i*60, 40, 40));
			Add(new Canvas.Drawable(caption_txt, null, 148, 170+i*60, 170, 30, cur.Name));
			Add(new Canvas.Drawable(Shape.Rectangle, null, 320, 160+i*60, 2, 40, "#000"));
			Add(new Canvas.Drawable(caption_txt, null, 333, 170+i*60, 54, 30, ""+cur.data.units_gained));
			Add(new Canvas.Drawable(Shape.Rectangle, null, 405, 160+i*60, 2, 40, "#000"));
			Add(new Canvas.Drawable(caption_txt, null, 419, 170+i*60, 54, 30, ""+cur.data.money_gained));
			Add(new Canvas.Drawable(Shape.Rectangle, null, 490, 160+i*60, 2, 40, "#000"));
			Add(new Canvas.Drawable(caption_txt, null, 495, 170+i*60, 54, 30, ""+cur.data.turns_alive));
			Add(new Canvas.Drawable(Shape.Rectangle, null, 565, 160+i*60, 2, 40, "#000"));
			Add(new Canvas.Drawable(caption_txt, null, 575, 170+i*60, 200, 30, ""+cur.data.damage_delt));
		}

		Add(new Canvas.Drawable({ // default display
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,350,75,Menu.Button[0]);
				new Text_Class("36pt Verdana", Menu.Button[2]).Draw(c,x+90,y+20,260,55,"FINISH");
				new Text_Class("36pt Verdana", Menu.Button[3]).Draw(c,x+87,y+17,260,55,"FINISH");
			}
		}, null, 430, 25, 350, 75), close_func, { // hovered display
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,350,75,Menu.Button[1]);
				new Text_Class("36pt Verdana", Menu.Button[2]).Draw(c,x+90,y+20,260,55,"FINISH");
				new Text_Class("36pt Verdana", Menu.Button[3]).Draw(c,x+87,y+17,260,55,"FINISH");
			}
		});
	}
}
