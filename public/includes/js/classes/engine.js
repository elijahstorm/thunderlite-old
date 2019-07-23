var Engine_Class = function(input, is_sample)
{
	var UI;
	var Terrain_Animations = [];
	var Units = [];
	var Cities = [];
	var Players = [];
	var Connected_Players = [];
	var turn = 0;
	var cur_player = 0;
	var client = null;
	var terre;
	var units;
	var cities;
	this.Terrain_Map = terre;
	this.Units_Map = units;
	this.Cities_Map = cities;
	this.Name = null;
	this.Interface = UI;
	this.Game_Over = false;
	this.Map = null; // this should be game data id for server
	this.id = null;
	this.valid = true;
	var global_weather;
	var demo_game = [false,null];

	this.Set_Interface = function(ui)
	{
		UI = ui;
		this.Interface = ui;
	}
	this.End_Game = function(client_won)
	{
		this.Game_Over = true;
		if(UI!=null)
		{
			Select_Animation.Remove_All();
			Repair_Animation.Remove_All();
			for(var x=1;x<Terrain_Data.TERRE.length;x++)
			{
				var _t = Terrain_Data.TERRE[x];
				
				if(_t.Connnection==5 || _t.Connnection==3)
				{
					Animations.Retrieve(_t.Name+" Ani").Remove_All();
				}
			}
		}
		for(var x=0;x<terre.Width;x++)
		for(var y=0;y<terre.Height;y++)
		{
			terre.At(x, y).Delete();
		}
		if(is_sample)return;
		setTimeout(function(){
			if(demo_game[0]!=false)
			{
				if(UI!=null)
					UI.End_Game();
				openMapEditor(demo_game[1], client_won);
			}
			else if(UI!=null)
				UI.End_Game(Players, turn);
			demo_game = [false,null];
		}, 750);
	};
	this.Hide_Animations = function()
	{
		for(var i=0;i<Units.length;i++)
		{
			Units[i].Hide_Animation_Display();
		}
		for(var i=0;i<Cities.length;i++)
		{
			Cities[i].Hide_Animation_Display();
		}
	};
	this.Hide_Terrain_Anis = function()
	{
		for(var i=0;i<Terrain_Animations.length;i++)
		{
			Terrain_Animations[i].Hide_Animation_Display();
		}
	};

	this.Found_By_Radar = function(_unit)
	{
		var jammerCheck = this.Units_Map.At(_unit.X+2, _unit.Y);
		if(jammerCheck!=null)
		if(jammerCheck.Radar())
		if(jammerCheck.Player!=_unit.Player)
			return true;
		jammerCheck = this.Units_Map.At(_unit.X-2, _unit.Y);
		if(jammerCheck!=null)
		if(jammerCheck.Radar())
		if(jammerCheck.Player!=_unit.Player)
			return true;
		jammerCheck = this.Units_Map.At(_unit.X, _unit.Y+2);
		if(jammerCheck!=null)
		if(jammerCheck.Radar())
		if(jammerCheck.Player!=_unit.Player)
			return true;
		jammerCheck = this.Units_Map.At(_unit.X, _unit.Y-2);
		if(jammerCheck!=null)
		if(jammerCheck.Radar())
		if(jammerCheck.Player!=_unit.Player)
			return true;
		jammerCheck = this.Units_Map.At(_unit.X+1, _unit.Y+1);
		if(jammerCheck!=null)
		if(jammerCheck.Radar())
		if(jammerCheck.Player!=_unit.Player)
			return true;
		jammerCheck = this.Units_Map.At(_unit.X-1, _unit.Y-1);
		if(jammerCheck!=null)
		if(jammerCheck.Radar())
		if(jammerCheck.Player!=_unit.Player)
			return true;
		jammerCheck = this.Units_Map.At(_unit.X-1, _unit.Y+1);
		if(jammerCheck!=null)
		if(jammerCheck.Radar())
		if(jammerCheck.Player!=_unit.Player)
			return true;
		jammerCheck = this.Units_Map.At(_unit.X+1, _unit.Y-1);
		if(jammerCheck!=null)
		if(jammerCheck.Radar())
		if(jammerCheck.Player!=_unit.Player)
			return true;
		return false;
	};
	this.Location_In_Radar = function(_x, _y, checkedTeam)
	{
		var jammerCheck = this.Units_Map.At(_x+2, _y);
		if(jammerCheck!=null)
		if(jammerCheck.Player!=checkedTeam)
		if(jammerCheck.Radar())
			return true;
		jammerCheck = this.Units_Map.At(_x-2, _y);
		if(jammerCheck!=null)
		if(jammerCheck.Player!=checkedTeam)
		if(jammerCheck.Radar())
			return true;
		jammerCheck = this.Units_Map.At(_x, _y+2);
		if(jammerCheck!=null)
		if(jammerCheck.Player!=checkedTeam)
		if(jammerCheck.Radar())
			return true;
		jammerCheck = this.Units_Map.At(_x, _y-2);
		if(jammerCheck!=null)
		if(jammerCheck.Player!=checkedTeam)
		if(jammerCheck.Radar())
			return true;
		jammerCheck = this.Units_Map.At(_x+1, _y+1);
		if(jammerCheck!=null)
		if(jammerCheck.Player!=checkedTeam)
		if(jammerCheck.Radar())
			return true;
		jammerCheck = this.Units_Map.At(_x-1, _y-1);
		if(jammerCheck!=null)
		if(jammerCheck.Player!=checkedTeam)
		if(jammerCheck.Radar())
			return true;
		jammerCheck = this.Units_Map.At(_x-1, _y+1);
		if(jammerCheck!=null)
		if(jammerCheck.Player!=checkedTeam)
		if(jammerCheck.Radar())
			return true;
		jammerCheck = this.Units_Map.At(_x+1, _y-1);
		if(jammerCheck!=null)
		if(jammerCheck.Player!=checkedTeam)
		if(jammerCheck.Radar())
			return true;
		jammerCheck = this.Units_Map.At(_x+1, _y);
		if(jammerCheck!=null)
		if(jammerCheck.Player!=checkedTeam)
		if(jammerCheck.Radar())
			return true;
		jammerCheck = this.Units_Map.At(_x-1, _y);
		if(jammerCheck!=null)
		if(jammerCheck.Player!=checkedTeam)
		if(jammerCheck.Radar())
			return true;
		jammerCheck = this.Units_Map.At(_x, _y+1);
		if(jammerCheck!=null)
		if(jammerCheck.Player!=checkedTeam)
		if(jammerCheck.Radar())
			return true;
		jammerCheck = this.Units_Map.At(_x, _y-1);
		if(jammerCheck!=null)
		if(jammerCheck.Player!=checkedTeam)
		if(jammerCheck.Radar())
			return true;
		return false;
	};
	this.Radar_Search = function(_unit)
	{
		var list = [];
		var jammerCheck = this.Units_Map.At(_unit.X+2, _unit.Y);
		if(jammerCheck!=null)
		if(jammerCheck.Alpha.Get()<255)
		if(jammerCheck.Player!=_unit.Player)
			list.push(jammerCheck);
		jammerCheck = this.Units_Map.At(_unit.X-2, _unit.Y);
		if(jammerCheck!=null)
		if(jammerCheck.Alpha.Get()<255)
		if(jammerCheck.Player!=_unit.Player)
			list.push(jammerCheck);
		jammerCheck = this.Units_Map.At(_unit.X, _unit.Y+2);
		if(jammerCheck!=null)
		if(jammerCheck.Alpha.Get()<255)
		if(jammerCheck.Player!=_unit.Player)
			list.push(jammerCheck);
		jammerCheck = this.Units_Map.At(_unit.X, _unit.Y-2);
		if(jammerCheck!=null)
		if(jammerCheck.Alpha.Get()<255)
		if(jammerCheck.Player!=_unit.Player)
			list.push(jammerCheck);
		jammerCheck = this.Units_Map.At(_unit.X+1, _unit.Y+1);
		if(jammerCheck!=null)
		if(jammerCheck.Alpha.Get()<255)
		if(jammerCheck.Player!=_unit.Player)
			list.push(jammerCheck);
		jammerCheck = this.Units_Map.At(_unit.X-1, _unit.Y-1);
		if(jammerCheck!=null)
		if(jammerCheck.Alpha.Get()<255)
		if(jammerCheck.Player!=_unit.Player)
			list.push(jammerCheck);
		jammerCheck = this.Units_Map.At(_unit.X-1, _unit.Y+1);
		if(jammerCheck!=null)
		if(jammerCheck.Alpha.Get()<255)
		if(jammerCheck.Player!=_unit.Player)
			list.push(jammerCheck);
		jammerCheck = this.Units_Map.At(_unit.X+1, _unit.Y-1);
		if(jammerCheck!=null)
		if(jammerCheck.Alpha.Get()<255)
		if(jammerCheck.Player!=_unit.Player)
			list.push(jammerCheck);
		return list;
	};
	this.Detected_By_Enemy = function(_unit)
	{
		var enemy_check = this.Units_Map.At(_unit.X+1, _unit.Y);
		if(enemy_check!=null)
		if(enemy_check.Player.Team!=_unit.Player.Team)
			return true;
		enemy_check = this.Units_Map.At(_unit.X-1, _unit.Y);
		if(enemy_check!=null)
		if(enemy_check.Player.Team!=_unit.Player.Team)
			return true;
		enemy_check = this.Units_Map.At(_unit.X, _unit.Y+1);
		if(enemy_check!=null)
		if(enemy_check.Player.Team!=_unit.Player.Team)
			return true;
		enemy_check = this.Units_Map.At(_unit.X, _unit.Y-1);
		if(enemy_check!=null)
		if(enemy_check.Player.Team!=_unit.Player.Team)
			return true;
		return this.Found_By_Radar(_unit);
	};
	this.Collect_Visible_Enemies = function(_player)
	{
		var data = [];
		let u, t, _amt = _player.Total_Units();
		for(let i=0;i<_amt;i++)
		{
			u = _player.Get_Unit(i);
			list = Core.Target.Diamond(u.Sight);
			for(let l in list)
			{
				t = this.Units_Map.At(u.X+list[l][0], u.Y+list[l][1]);
				if(t==null)continue;
				if(t.Player==_player)continue;
				if(data.includes(t))continue;
				let x = this.Terrain_Map.At(t.X, t.Y);
				if(x.Source == 3 ||
					x.Source == 4 ||
					x.Source == 14 ||
					x.Source == 15)
					{	// you need to be one space away to see these in fog
						if(!u.Radar())
						if(Math.abs(list[l][0])+Math.abs(list[l][1])>1)
							continue;
					}
				data.push(t);
			}
		}
		_amt = _player.Building_Amount();
		for(let i=0;i<_amt;i++)
		{
			u = _player.Get_Building(i);
			if(u.Source==1)
			{	// command center
				list = Core.Target.Diamond(2);
				for(let l in list)
				{
					t = this.Units_Map.At(u.X+list[l][0], u.Y+list[l][1]);
					if(t==null)continue;
					if(t.Player==_player)continue;
					if(data.includes(t))continue;
					let x = this.Terrain_Map.At(t.X, t.Y);
					if(x.Source == 3 ||
						x.Source == 4 ||
						x.Source == 14 ||
						x.Source == 15)
						{	// you need to be one space away to see these in fog
							if(Math.abs(list[l][0])+Math.abs(list[l][1])>1)
								continue;
						}
					data.push(t);
				}
				continue;
			}
			t = this.Units_Map.At(u.X, u.Y);
			if(t==null)continue;
			if(t.Player==_player)continue;
			if(data.includes(t))continue;
			data.push(t);
		}
		return data;
	};
	this.Hide_Terrain = function()
	{
		if(!global_weather[0])return;
		for(let x=0;x<this.Terrain_Map.Width;x++)
		for(let y=0;y<this.Terrain_Map.Height;y++)
			this.Terrain_Map.At(x, y).Hidden = true;
	};
	this.Player_Visibility = function(_player)
	{
		if(!global_weather[0])return;
		if(_player!=client)return;
		
		this.Hide_Terrain();
		
		let u, _amt = _player.Total_Units();
		for(let i=0;i<_amt;i++)
		{
			u = _player.Get_Unit(i);
			this.Unit_Visibility(u);
		}
		_amt = _player.Building_Amount();
		for(let i=0;i<_amt;i++)
		{
			u = _player.Get_Building(i);
			this.City_Visibility(u);
		}
	};
	this.Unit_Visibility = function(_unit)
	{
		if(!global_weather[0])return;
		if(_unit.Player!=client)return;
		let t, list = Core.Target.Diamond(_unit.Sight)
		for(let l in list)
		{
			t = this.Terrain_Map.At(_unit.X+list[l][0], _unit.Y+list[l][1]);
			if(t==null)continue;
			if(t.Source == 3 ||
				t.Source == 4 ||
				t.Source == 14 ||
				t.Source == 15)
				{	// you need to be one space away to see these in fog
					if(!_unit.Radar())
					if(Math.abs(list[l][0])+Math.abs(list[l][1])>1)
						continue;
				}
			t.Hidden = false;
		}
	};
	this.City_Visibility = function(_city)
	{
		if(!global_weather[0])return;
		if(_city.Owner!=client)return;
		if(_city.Source==1)
		{	// command center
			let t, list = Core.Target.Diamond(2);
			for(let l in list)
			{
				t = this.Terrain_Map.At(_city.X+list[l][0], _city.Y+list[l][1]);
				if(t==null)continue;
				if(t.Source == 3 ||
					t.Source == 4 ||
					t.Source == 14 ||
					t.Source == 15)
					{	// you need to be one space away to see these in fog
						if(Math.abs(list[l][0])+Math.abs(list[l][1])>1)
							continue;
					}
				t.Hidden = false;
			}
			return;
		}
		
		if(_city.Owner==client)
			_city.Terrain.Hidden = false;
		else _city.Terrain.Hidden = true;
	};
	this.Move = function(unit, x, y, path, whenFinished)
	{
		if(unit.SELECTABLE==null)
		{
			var found = false;
			for(var i in Units)
			{
				if(Units[i].Index==unit)
				{
					unit = Units[i];
					found = true;
					break;
				}
			}
			if(!found)
			{
				if(whenFinished!=null)whenFinished(unit);
				return false;
			}
		}
		if(!unit.Active)
		{
			if(whenFinished!=null)whenFinished(unit);
			return false;
		}
		return unit.Act(x, y, path, whenFinished);
	};
	this.Build = function(city, input, whenFinished)
	{
		if(city.SELECTABLE==null)
		{
			var found = false;
			for(var i in Cities)
			{
				if(Cities[i].Index==city)
				{
					city = Cities[i];
					found = true;
					break;
				}
			}
			if(!found)
			{
				if(whenFinished!=null)whenFinished(city);
				return false;
			}
		}
		return city.Act(input, whenFinished);
	};
	this.Check_Player_Standing = function(__team)
	{	// standing is a numerical rating out of 5 showing how well the player is comparing
		if(Players[__team]==null)return -1;
		var standing = 0; // 0 is bad, the higher the better the position
		
		var percentOfUnits = (Players[__team].Total_Units()/Units.length)*Players.length;
		if(percentOfUnits>0.4)
		{
			standing++;
		}
		if(percentOfUnits>.8)
		{
			standing++;
		}
		if(percentOfUnits>1.2)
		{
			standing++;
		}
		if(percentOfUnits>1.6)
		{
			standing++;
		}
		
		return standing; // can be thought of as out of 5 stars
	};

	this.Add_Unit = function(input, x, y, team)
	{
		if(units.At(x,y)!=null)
		{
			console.error("Map position ("+x+","+y+") already occupied with "+units.At(x,y));
			return;
		}
		if(Players.length<=team)
		{
			console.error("Team number not valid.");
			return;
		}
		input.Index = Units.length;
		Units.push(input);
		units.Set(x,y,input);
		terre.At(x, y).Unit = input;
		Players[team].Add_Unit(input);
		input.X = x;
		input.Y = y;
		this.Unit_Visibility(input);
		return input;
	};
	this.Add_Building = function(input, x, y, team)
	{
		if(cities.At(x,y)!=null)
		{
			console.error("Map position already occupied.");
			return;
		}
		input.Index = Cities.length;
		Cities.push(input);
		cities.Set(x,y,input);
		var ter = terre.At(x,y);
		ter.Building = input;
		input.Terrain = ter;
		input.X = x;
		input.Y = y;
		if(team!=null && team!=-1)
		{
			if(team>=Players.length)
			{
				console.error("Team number not valid.");
				return;
			}
			Players[team].Capture(input);
		}
		return input;
	};
	this.Unit_Amount = function()
	{
		return Units.length;
	};
	this.Get_Unit = function(index)
	{
		if(index<Units.length)
		{
			return Units[index];
		}
		return null;
	};
	this.Building_Amount = function()
	{
		return Cities.length;
	};
	this.Get_Building = function(index)
	{
		if(index<Cities.length)
		{
			return Cities[index];
		}
		return null;
	};
	this.Remove_Unit = function(value)
	{
		var pos = Units.indexOf(value);
		if(~pos)
		{
			this.Units_Map.Set(value.X,value.Y,null);
			Units.splice(pos,1);
			return true;
		}
		return false;
	};
	this.Instances_Of = function(name)
	{
		var counter = 0;
		for(var i in Units)
		{
			if(Units[i].Name==name)
			{
				counter++;
			}
		}
		return counter;
	};

	var full = false;
	this.Full = function()
	{
		return full;
	};
	this.Set_Player = function(index, id, name, is_client)
	{
		Connected_Players[index] = id;
		Players[index].Name = name;
		if(is_client)
		{
			client = Players[index];
			this.Player_Visibility(client);
		}
		for(var i in Connected_Players)
		{
			if(Connected_Players[i]==null)
			{
				full = false;
				return;
			}
		}
		full = true;
	};
	this.Host_Game = function(id)
	{
		this.id = id;
		if(online)socket.emit('start');
		this.Start();
		if(global_weather[0])
			AI.Fog_Check = true;
		else AI.Fog_Check = false;
	};
	this.Start = function()
	{
		currently_playing = true;
		if(UI!=null)
		{
			UI.Close_Menu();
			Canvas.Reflow();
			UI.Start();
			UI.Draw();
			if(online)
			{
				var active_player = Players[cur_player];
				var self = this;
				UI.Select_Tile();
				UI.Set_Next_Player(active_player, function(){
					active_player.Start_Turn(socket.index==Connected_Players[cur_player], function(){
						if(Connected_Players[cur_player]==null)
						{	/// start AI
							setTimeout(function(){
								AI.Solve(self,active_player);
							}, AI.TIMEOUT);
						}
					});
				});
			}
			else UI.Set_Next_Player(Players[cur_player]);
			if(!online)console.log("not online");
		}
		animationCanvas.clearRect(0, 0, 900, 900);
		LOG.add("Game took " + Math.round(t1 - t0) + "ms to load", "#FFF", 8000);
	};
	this.Leave = function(slot)
	{
		Players[slot].Lose();
		if(UI)UI.ReportLeft(slot);
	};

	this.Data = function()
	{	/// fix this
		var self = this;
		var player_data = [];
		for(var i in Players)
		{
			player_data.push(Players[i].Data());
		}
		return {
			id:self.id,
			map:self.Map,
			name:self.Name,
			turn:turn,
			cur_player:cur_player,
			connected:Connected_Players,
			players:player_data
		};
	};
	this.Clone = function()
	{
		return new Engine_Class(JSON.stringify(this.Data()));
	};
	this.Restart = function()
	{
		if(UI!=null)
		{
			UI.Select_Tile();
		}
		Units = [];
		Players = [];
		Connected_Players = [];
		turn = 0;
		cur_player = 0;
		Units_Map.Wipe();
	};

	this.Add_Player = function(name, color)
	{
		var player = new Player_Class(this, name, Players.length, color);
		Players.push(player);
		Connected_Players.push(null);
		return player;
	};
	this.Player_Died = function(input)
	{
		var pos = Players.indexOf(input);
		if(~pos)
		{
			Players[pos].Dead = true;
			var alive = -1;
			for(var i in Players)
			{
				if(!Players[i].Dead)
				{
					if(alive!=-1)
					{
						alive = -1;
						break;
					}
					alive = i;
				}
			}
			if(alive!=-1)
			{
				this.Player_Won(Players[alive]);
			}
			if(UI!=null)
				UI.Draw();
			return;
		}
		console.error("Player not attached to this game.");
	};
	this.Player_Won = function(input)
	{
		var pos = Players.indexOf(input);
		if(~pos)
		{
			if(UI==null)return;
			for(var i in Players)
			{
				if(Players[i]==null)continue;
				if(Players[i]==input)continue;
				if(Players[i].Dead)continue;
				Players[i].Kill_All(true);
			}
			var self = this;
			self.Game_Over = true;
			setTimeout(function(){
				alert(input.Name+" wins!");
				self.End_Game(client == input);
			},700);
			return;
		}
		console.error("Player not attached to this game.");
	};
	this.Total_Players = function()
	{
		return Players.length;
	};
	this.Active_Player = function()
	{
		return Players[cur_player];
	};
	this.Client_Player = function()
	{
		return client;
	};
	this.AI_Players = function(_player)
	{
		var list = [];
		if(_player==null)
		{	// return list of AI players
			for(var i in Connected_Players)
			{
				if(Connected_Players[i]==null)
				{
					list.push(i);
				}
			}
			return list;
		}
		return Connected_Players[_player.Team]==null;
	};
	this.Player = function(index)
	{
		if(index>=Players.length)return null;
		return Players[index];
	};
	this.Next_Player = function()
	{
		if(this.Game_Over)return;
		if(UI!=null)
		{
			if(!UI.Check_Controls())return;
			SFXs.Stop_Loops();
		}
		cur_player++;
		while(Players[cur_player%Players.length].Dead)cur_player++;
		if(cur_player>=Players.length)
		{
			cur_player = 0;
			turn++;
		}
		if(UI!=null)
		{
			var active_player = Players[cur_player];
			var self = this;
			UI.Select_Tile();
			UI.Set_Next_Player(active_player, function(){
				active_player.Start_Turn(socket.index==Connected_Players[cur_player], function(){
					if(Connected_Players[cur_player]==null)
					{	/// start AI
						setTimeout(function(){
							AI.Solve(self,active_player);
						}, AI.TIMEOUT);
					}
				});
			});
		}
	};
	this.Request_Connections = function()
	{
		var nameList = [];
		for(var i in Players)
		{
			if(Connected_Players[i]==null)continue;
			nameList.push([Players[i].Name, Connected_Players[i]]);
		}
		return nameList;
	};
	this.Turn = function()
	{
		return turn;
	};

	this.Set_Interface = function(ui)
	{
		this.Interface = ui;
		UI = ui;
	};

	
	let t0 = performance.now();
	if(input!=null)
	{			/// when input is new map data or map id--make new game
		if(input.Valid)
		{		/// input is map_data
	console.time("parse data");
			demo_game = [true, input];
			var data = Levels.Play_Custom(this, input);
			var __terre = data[0];
			var __units = data[1];
			var __cities = data[2];
			if(__terre==null)return;
			global_weather = data[3];
	console.timeEnd("parse data");
	
	console.time("loading map");	
				// inside the map work
			var old_map = __terre;
			var map = new Array(old_map.length);
			var _sprite_id,
				index,
				boundsX = old_map.length,
				boundsY = old_map[0].length,
				xtra_size = INTERFACE.Outside_Map,
				change_amt;
			if(is_sample)
				xtra_size = 0;
			var paint_off_map = new Array(boundsX+(xtra_size*2));
			for(var x=0;x<paint_off_map.length;x++)
				paint_off_map[x] = new Array(boundsY+(xtra_size*2));
			for(var d=0;d<xtra_size;d++)
			{	// set corners of out of bounds area
				paint_off_map[d][d] = 1;
				paint_off_map[paint_off_map.length-1-d][d] = 1;
				paint_off_map[d][paint_off_map[0].length-1-d] = 1;
				paint_off_map[paint_off_map.length-1-d][paint_off_map[0].length-1-d] = 1;
			}
			for(var x=0;x<boundsX;x++)
			{	// set realistic out of bounds map data
				for(var y=0;y<boundsY;y++)
				{	/// paint a realistic out of bounds area
					paint_off_map[x+xtra_size][y+xtra_size] = old_map[x][y];
					
					if(x==0)
					{	/// left side
						index = old_map[x][y];
						index = index>=12 ? 1 : index; // border must be land
						index = Terrain_Data.TERRE[index].Connnection!=2 || Math.random()>.65 ? Math.floor(Math.random()*6)+1 : index;
							// border can't have angled connection sprites
						change_amt = Math.random()>.4 ? Math.floor(Math.random()*xtra_size)+1 : 1;
						
						for(var i=1;i<=xtra_size;i++)
						for(var j=0;j<change_amt+i-1;j++)
						{
							if(paint_off_map[x+xtra_size-i][y+xtra_size]==null)
								paint_off_map[x+xtra_size-i][y+xtra_size] = index;
							
							if(j==0)continue;
							if(paint_off_map[x+xtra_size-i].length>y+xtra_size+j)
								paint_off_map[x+xtra_size-i][y+xtra_size+j] = index;
							if(0<=y+xtra_size-j)
								paint_off_map[x+xtra_size-i][y+xtra_size-j] = index;
						}
					}
					if(x==boundsX-1)
					{	/// right side
						index = old_map[x][y];
						index = index>=12 ? 1 : index; // border must be land
						index = Terrain_Data.TERRE[index].Connnection!=2 || Math.random()>.65 ? Math.floor(Math.random()*6)+1 : index;
							// border can't have angled connection sprites
						change_amt = Math.random()>.4 ? Math.floor(Math.random()*xtra_size)+1 : 1;
						
						for(var i=1;i<=xtra_size;i++)
						for(var j=0;j<change_amt+i-1;j++)
						{
							if(paint_off_map[x+xtra_size+i][y+xtra_size]==null)
								paint_off_map[x+xtra_size+i][y+xtra_size] = index;
							
							if(j==0)continue;
							if(paint_off_map[x+xtra_size+i].length>y+xtra_size+j)
								paint_off_map[x+xtra_size+i][y+xtra_size+j] = index;
							if(0<=y+xtra_size-j)
								paint_off_map[x+xtra_size+i][y+xtra_size-j] = index;
						}
					}
					
					if(y==0)
					{	/// top side
						index = old_map[x][y];
						index = index>=12 ? 1 : index; // border must be land
						index = Terrain_Data.TERRE[index].Connnection!=2 || Math.random()>.65 ? Math.floor(Math.random()*6)+1 : index;
							// border can't have angled connection sprites
						change_amt = Math.random()>.4 ? Math.floor(Math.random()*xtra_size)+1 : 1;
						
						for(var i=1;i<=xtra_size;i++)
						for(var j=0;j<change_amt+i-1;j++)
						{
							if(paint_off_map[x+xtra_size][y+xtra_size-i]==null)
								paint_off_map[x+xtra_size][y+xtra_size-i] = index;
							
							if(j==0)continue;
							if(paint_off_map.length>x+xtra_size+j)
								paint_off_map[x+xtra_size+j][y+xtra_size-i] = index;
							if(0<=x+xtra_size-j)
								paint_off_map[x+xtra_size-j][y+xtra_size-i] = index;
						}
					}
					if(y==boundsY-1)
					{	/// top side
						index = old_map[x][y];
						index = index>=12 ? 1 : index; // border must be land
						index = Terrain_Data.TERRE[index].Connnection!=2 || Math.random()>.65 ? Math.floor(Math.random()*6)+1 : index;
							// border can't have angled connection sprites
						change_amt = Math.random()>.4 ? Math.floor(Math.random()*xtra_size)+1 : 1;
						
						for(var i=1;i<=xtra_size;i++)
						for(var j=0;j<change_amt+i-1;j++)
						{
							if(paint_off_map[x+xtra_size][y+xtra_size+i]==null)
								paint_off_map[x+xtra_size][y+xtra_size+i] = index;
							
							if(j==0)continue;
							if(paint_off_map.length>x+xtra_size+j)
								paint_off_map[x+xtra_size+j][y+xtra_size+i] = index;
							if(0<=x+xtra_size-j)
								paint_off_map[x+xtra_size-j][y+xtra_size+i] = index;
						}
					}
				}
			}
			
			for(var x=0;x<old_map.length;x++)
			{	// turn map data into functional terrain
				map[x] = new Array(old_map[x].length);
				for(var y=0;y<old_map[x].length;y++)
				{
					index = old_map[x][y];
					_sprite_id = Terrain_Data.Connnection_Decision(index, paint_off_map, x+xtra_size, y+xtra_size);
					map[x][y] = new Terrain.Terre_Class(this,index,"Terrain("+x+","+y+")",x,y,_sprite_id);
					if(global_weather[0])	// if foggy, hide everything
						map[x][y].Hidden = true;
					if(Terrain_Data.TERRE[index].Connnection==5)
						Terrain_Animations.push(map[x][y]);
				}
			}
			
			var outside_map = new Array(paint_off_map.length);
			for(var x=0;x<paint_off_map.length;x++)
			{	// turn out of bounds map data into displayable terrain
				outside_map[x] = new Array(paint_off_map[x].length);
				for(var y=0;y<paint_off_map[x].length;y++)
				{
					if(x>xtra_size && y>xtra_size && x<paint_off_map.length-xtra_size-1 && y<paint_off_map[x].length-xtra_size-1)
					{
						outside_map[x][y] = paint_off_map[x][y];
						continue;
					}
					index = paint_off_map[x][y];
					if(index==null)
						index = 1;
					_sprite_id = Terrain_Data.Connnection_Decision(index, paint_off_map, x, y);
					outside_map[x][y] = new Terrain.Terre_Class(this,index,"Outside("+x+","+y+")",-1,-1, _sprite_id);
				}
			}
			this.Paint_Off_Map = outside_map;
			this.map_source_data = __terre;
				// outside the map work
	console.timeEnd("loading map");
			
			this.Terrain_Map = new Map_Holder(map);
			this.Units_Map = new Map_Holder(Blank_Map(this.Terrain_Map.Width, this.Terrain_Map.Height));
			this.Cities_Map = new Map_Holder(Blank_Map(this.Terrain_Map.Width, this.Terrain_Map.Height));
			
			terre = this.Terrain_Map;
			units = this.Units_Map;
			cities = this.Cities_Map;

	console.time("coloring assets");
			for(var i in __units)
			{
				this.Add_Unit(Characters.New(this,Char_Data.Reverse_Get(__units[i][0]).Name), __units[i][1], __units[i][2], __units[i][3]);
			}
			for(var i in __cities)
			{
				this.Add_Building(Buildings.New(this,Building_Data.Reverse_Get(__cities[i][0]).Name), __cities[i][1], __cities[i][2], __cities[i][3]);
			}
	console.timeEnd("coloring assets");
	
		}
		else if(input.Name==null)
		{		/// input is a local map id
			var old_map = Clone_Map(Levels.Terrain.Data(input));
			var map = new Array(old_map.length);
			if(old_map!=null)
			{
				var _sprite_id,
					index,
					boundsX = old_map.length,
					boundsY = old_map[0].length,
					xtra_size = INTERFACE.Outside_Map,
					change_amt;
				if(is_sample)
					xtra_size = 0;
				var paint_off_map = new Array(boundsX+(xtra_size*2));
				for(var x=0;x<paint_off_map.length;x++)
					paint_off_map[x] = new Array(boundsY+(xtra_size*2));
				for(var x=0;x<boundsX;x++)
				{
					for(var y=0;y<boundsY;y++)
					{	/// paint a realistic out of bounds area
						paint_off_map[x+xtra_size][y+xtra_size] = old_map[x][y];
						
						if(x==0)
						{	/// left side
							index = old_map[x][y];
							index = index>=10 ? 1 : index; // border must be land
							index = Terrain_Data.TERRE[index].Connnection!=2 || Math.random()>.65 ? Math.floor(Math.random()*4)+1 : index;
								// border can't have angled connection sprites
							change_amt = Math.random()>.4 ? Math.floor(Math.random()*xtra_size)+1 : 1;
							
							for(var i=1;i<=xtra_size;i++)
							for(var j=0;j<change_amt+i-1;j++)
							{
								if(paint_off_map[x+xtra_size-i][y+xtra_size]==null)
									paint_off_map[x+xtra_size-i][y+xtra_size] = index;
								
								if(j==0)continue;
								if(paint_off_map[x+xtra_size-i].length>y+xtra_size+j)
									paint_off_map[x+xtra_size-i][y+xtra_size+j] = index;
								if(0<=y+xtra_size-j)
									paint_off_map[x+xtra_size-i][y+xtra_size-j] = index;
							}
						}
						if(x==boundsX-1)
						{	/// right side
							index = old_map[x][y];
							index = index>=10 ? 1 : index; // border must be land
							index = Terrain_Data.TERRE[index].Connnection!=2 || Math.random()>.65 ? Math.floor(Math.random()*4)+1 : index;
								// border can't have angled connection sprites
							change_amt = Math.random()>.4 ? Math.floor(Math.random()*xtra_size)+1 : 1;
							
							for(var i=1;i<=xtra_size;i++)
							for(var j=0;j<change_amt+i-1;j++)
							{
								if(paint_off_map[x+xtra_size+i][y+xtra_size]==null)
									paint_off_map[x+xtra_size+i][y+xtra_size] = index;
								
								if(j==0)continue;
								if(paint_off_map[x+xtra_size+i].length>y+xtra_size+j)
									paint_off_map[x+xtra_size+i][y+xtra_size+j] = index;
								if(0<=y+xtra_size-j)
									paint_off_map[x+xtra_size+i][y+xtra_size-j] = index;
							}
						}
						
						if(y==0)
						{	/// top side
							index = old_map[x][y];
							index = index>=10 ? 1 : index; // border must be land
							index = Terrain_Data.TERRE[index].Connnection!=2 || Math.random()>.65 ? Math.floor(Math.random()*4)+1 : index;
								// border can't have angled connection sprites
							change_amt = Math.random()>.4 ? Math.floor(Math.random()*xtra_size)+1 : 1;
							
							for(var i=1;i<=xtra_size;i++)
							for(var j=0;j<change_amt+i-1;j++)
							{
								if(paint_off_map[x+xtra_size][y+xtra_size-i]==null)
									paint_off_map[x+xtra_size][y+xtra_size-i] = index;
								
								if(j==0)continue;
								if(paint_off_map.length>x+xtra_size+j)
									paint_off_map[x+xtra_size+j][y+xtra_size-i] = index;
								if(0<=x+xtra_size-j)
									paint_off_map[x+xtra_size-j][y+xtra_size-i] = index;
							}
						}
						if(y==boundsY-1)
						{	/// top side
							index = old_map[x][y];
							index = index>=10 ? 1 : index; // border must be land
							index = Terrain_Data.TERRE[index].Connnection!=2 || Math.random()>.65 ? Math.floor(Math.random()*4)+1 : index;
								// border can't have angled connection sprites
							change_amt = Math.random()>.4 ? Math.floor(Math.random()*xtra_size)+1 : 1;
							
							for(var i=1;i<=xtra_size;i++)
							for(var j=0;j<change_amt+i-1;j++)
							{
								if(paint_off_map[x+xtra_size][y+xtra_size+i]==null)
									paint_off_map[x+xtra_size][y+xtra_size+i] = index;
								
								if(j==0)continue;
								if(paint_off_map.length>x+xtra_size+j)
									paint_off_map[x+xtra_size+j][y+xtra_size+i] = index;
								if(0<=x+xtra_size-j)
									paint_off_map[x+xtra_size-j][y+xtra_size+i] = index;
							}
						}
					}
				}
				
				for(var x=0;x<old_map.length;x++)
				{
					map[x] = new Array(old_map[x].length);
					for(var y=0;y<old_map[x].length;y++)
					{
						index = old_map[x][y];
						_sprite_id = Terrain_Data.Connnection_Decision(index, paint_off_map, x+xtra_size, y+xtra_size);
						map[x][y] = new Terrain.Terre_Class(this,index,"Terrain("+x+","+y+")",x,y, _sprite_id);
						if(Terrain_Data.TERRE[index].Connnection==5)
							Terrain_Animations.push(map[x][y]);
					}
				}
				
				var outside_map = new Array(paint_off_map.length);
				for(var x=0;x<paint_off_map.length;x++)
				{
					outside_map[x] = new Array(paint_off_map[x].length);
					for(var y=0;y<paint_off_map[x].length;y++)
					{
						if(x>xtra_size && y>xtra_size && x<paint_off_map.length-xtra_size-1 && y<paint_off_map[x].length-xtra_size-1)
						{
							outside_map[x][y] = paint_off_map[x][y];
							continue;
						}
						index = paint_off_map[x][y];
						if(index==null)
							index = 1;
						_sprite_id = Terrain_Data.Connnection_Decision(index, paint_off_map, x, y);
						outside_map[x][y] = new Terrain.Terre_Class(this,index,"Outside("+x+","+y+")",-1,-1, _sprite_id);
					}
				}
				this.Paint_Off_Map = outside_map;
				this.map_source_data = old_map;
			}
			this.Map = input;
			this.id = -1;
			terre = new Map_Holder(map);
			units = new Map_Holder(Blank_Map(terre.Width, terre.Height));
			cities = new Map_Holder(Blank_Map(terre.Width, terre.Height));
			this.Terrain_Map = terre;
			this.Units_Map = units;
			this.Cities_Map = cities;
			Levels.Run(this, input);
		}
		else if(typeof(input)==='string')
		{		/// when input is encrypted data for existing game--load gamestate
			var data = JSON.parse(input);
			this.id = data.id;
			this.Map = data.map;
			this.Name = data.name;
			turn = data.turn;
			cur_player = data.cur_player;
			var old_map = Clone_Map(Levels.Terrain.Data(data.map));
			
			if(old_map!=null)
			{
				var _sprite_id,
					index,
					boundsX = old_map.length,
					boundsY = old_map[0].length,
					xtra_size = INTERFACE.Outside_Map,
					change_amt;
				if(is_sample)
					xtra_size = 0;
				var paint_off_map = new Array(boundsX+(xtra_size*2));
				for(var x=0;x<paint_off_map.length;x++)
					paint_off_map[x] = new Array(boundsY+(xtra_size*2));
				for(var x=0;x<boundsX;x++)
				{
					for(var y=0;y<boundsY;y++)
					{	/// paint a realistic out of bounds area
						paint_off_map[x+xtra_size][y+xtra_size] = old_map[x][y];
						
						if(x==0)
						{	/// left side
							index = old_map[x][y];
							index = index>=10 ? 1 : index; // border must be land
							index = Terrain_Data.TERRE[index].Connnection!=2 || Math.random()>.65 ? Math.floor(Math.random()*4)+1 : index;
								// border can't have angled connection sprites
							change_amt = Math.random()>.4 ? Math.floor(Math.random()*xtra_size)+1 : 1;
							
							for(var i=1;i<=xtra_size;i++)
							for(var j=0;j<change_amt+i-1;j++)
							{
								if(paint_off_map[x+xtra_size-i][y+xtra_size]==null)
									paint_off_map[x+xtra_size-i][y+xtra_size] = index;
								
								if(j==0)continue;
								if(paint_off_map[x+xtra_size-i].length>y+xtra_size+j)
									paint_off_map[x+xtra_size-i][y+xtra_size+j] = index;
								if(0<=y+xtra_size-j)
									paint_off_map[x+xtra_size-i][y+xtra_size-j] = index;
							}
						}
						if(x==boundsX-1)
						{	/// right side
							index = old_map[x][y];
							index = index>=10 ? 1 : index; // border must be land
							index = Terrain_Data.TERRE[index].Connnection!=2 || Math.random()>.65 ? Math.floor(Math.random()*4)+1 : index;
								// border can't have angled connection sprites
							change_amt = Math.random()>.4 ? Math.floor(Math.random()*xtra_size)+1 : 1;
							
							for(var i=1;i<=xtra_size;i++)
							for(var j=0;j<change_amt+i-1;j++)
							{
								if(paint_off_map[x+xtra_size+i][y+xtra_size]==null)
									paint_off_map[x+xtra_size+i][y+xtra_size] = index;
								
								if(j==0)continue;
								if(paint_off_map[x+xtra_size+i].length>y+xtra_size+j)
									paint_off_map[x+xtra_size+i][y+xtra_size+j] = index;
								if(0<=y+xtra_size-j)
									paint_off_map[x+xtra_size+i][y+xtra_size-j] = index;
							}
						}
						
						if(y==0)
						{	/// top side
							index = old_map[x][y];
							index = index>=10 ? 1 : index; // border must be land
							index = Terrain_Data.TERRE[index].Connnection!=2 || Math.random()>.65 ? Math.floor(Math.random()*4)+1 : index;
								// border can't have angled connection sprites
							change_amt = Math.random()>.4 ? Math.floor(Math.random()*xtra_size)+1 : 1;
							
							for(var i=1;i<=xtra_size;i++)
							for(var j=0;j<change_amt+i-1;j++)
							{
								if(paint_off_map[x+xtra_size][y+xtra_size-i]==null)
									paint_off_map[x+xtra_size][y+xtra_size-i] = index;
								
								if(j==0)continue;
								if(paint_off_map.length>x+xtra_size+j)
									paint_off_map[x+xtra_size+j][y+xtra_size-i] = index;
								if(0<=x+xtra_size-j)
									paint_off_map[x+xtra_size-j][y+xtra_size-i] = index;
							}
						}
						if(y==boundsY-1)
						{	/// top side
							index = old_map[x][y];
							index = index>=10 ? 1 : index; // border must be land
							index = Terrain_Data.TERRE[index].Connnection!=2 || Math.random()>.65 ? Math.floor(Math.random()*4)+1 : index;
								// border can't have angled connection sprites
							change_amt = Math.random()>.4 ? Math.floor(Math.random()*xtra_size)+1 : 1;
							
							for(var i=1;i<=xtra_size;i++)
							for(var j=0;j<change_amt+i-1;j++)
							{
								if(paint_off_map[x+xtra_size][y+xtra_size+i]==null)
									paint_off_map[x+xtra_size][y+xtra_size+i] = index;
								
								if(j==0)continue;
								if(paint_off_map.length>x+xtra_size+j)
									paint_off_map[x+xtra_size+j][y+xtra_size+i] = index;
								if(0<=x+xtra_size-j)
									paint_off_map[x+xtra_size-j][y+xtra_size+i] = index;
							}
						}
					}
				}
				
				for(var x=0;x<old_map.length;x++)
				{
					map[x] = new Array(old_map[x].length);
					for(var y=0;y<old_map[x].length;y++)
					{
						index = old_map[x][y];
						_sprite_id = Terrain_Data.Connnection_Decision(index, paint_off_map, x+xtra_size, y+xtra_size);
						map[x][y] = new Terrain.Terre_Class(this,index,"Terrain("+x+","+y+")",x,y,_sprite_id);
						if(Terrain_Data.TERRE[index].Connnection==5)
							Terrain_Animations.push(map[x][y]);
					}
				}
				
				var outside_map = new Array(paint_off_map.length);
				for(var x=0;x<paint_off_map.length;x++)
				{
					outside_map[x] = new Array(paint_off_map[x].length);
					for(var y=0;y<paint_off_map[x].length;y++)
					{
						if(x>xtra_size && y>xtra_size && x<paint_off_map.length-xtra_size-1 && y<paint_off_map[x].length-xtra_size-1)
						{
							outside_map[x][y] = paint_off_map[x][y];
							continue;
						}
						index = paint_off_map[x][y];
						if(index==null)
							index = 1;
						_sprite_id = Terrain_Data.Connnection_Decision(index, paint_off_map, x, y);
						outside_map[x][y] = new Terrain.Terre_Class(this,index,"Outside("+x+","+y+")",-1,-1, _sprite_id);
					}
				}
				this.Paint_Off_Map = outside_map;
				this.map_source_data = __terre;
			}
			else return;
			
			
			
			
			
			terre = new Map_Holder(old_map);
			units = new Map_Holder(Blank_Map(terre.Width, terre.Height));
			cities = new Map_Holder(Blank_Map(terre.Width, terre.Height));
			this.Terrain_Map = terre;
			this.Units_Map = units;
			this.Cities_Map = cities;
			Connected_Players = data.connected;
			var players = data.players;
			for(var p in players)
			{
				var p_data = players[p];
				var player = this.Add_Player(p_data.name, p_data.color);
				player.data = p_data.data;
				if(Connected_Players[p]==socket.index){
					client = player;
				}
				var cur_units = p_data.units;
				for(var u in cur_units)
				{
					var u_data = cur_units[u];
					this.Add_Unit(new Characters.Char_Class(this, u_data.index), u_data.x, u_data.y, p).Health = u_data.health;
				}
				var cur_build = p_data.cities;
				for(var b in cur_build)
				{
					var b_data = cur_build[b];
					var cur_b = this.Add_Building(new Buildings.Build_Class(this, b_data.index), b_data.x, b_data.y, p);
					cur_b.Stature.Set(b_data.stature);
					cur_b.Resources = b_data.resources;
				}
			}
			this.Paint_Off_Map = outside_map;
			this.map_source_data = old_map;
		}
	}
	else this.valid = false; // game does not have valid input to function
	let t1 = performance.now();
};