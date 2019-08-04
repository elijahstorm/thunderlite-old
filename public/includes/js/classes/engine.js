var Engine_Data = function(data)
{	/// input is data from existing game -> load gamestate
		if(!data.valid)
		{
			console.error("Invalid game");
			return;
		}

		this.Interface = Fast_Fake_Interface;
		this.id = data.id;
		this.Valid = data.valid;
		this.Map = data.map;
		this.Name = data.name;
		let turn = data.turn;
		this.Turn = function(){
			return turn;
		};
		this.Active_Player = data.cur_player;
		this.Weather = [false,false,false];
		this.Terrain_Map = data.Terrain;
		this.Units_Map = new Map_Holder(Blank_Map(this.Terrain_Map.Width, this.Terrain_Map.Height));
		this.Cities_Map = new Map_Holder(Blank_Map(this.Terrain_Map.Width, this.Terrain_Map.Height));
		let terre = this.Terrain_Map;
		let units = this.Units_Map,
			cities = this.Cities_Map;

		this.Add_Player = function(name)
		{
			var player = new Player_Class(this, name, Players.length, -1);
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
				return;
			}
			console.error("Player not attached to this game.");
		};
		this.Player_Won = function(input)
		{
			var pos = Players.indexOf(input);
			if(!~pos)return;
			for(var i in Players)
			{
				if(Players[i]==null)continue;
				if(Players[i]==input)continue;
				if(Players[i].Dead)continue;
				Players[i].Kill_All();
			}
			var self = this;
			self.Game_Over = true;
		};
		this.Total_Players = function()
		{
			return Players.length;
		};
		this.Player = function(index)
		{
			if(index>=Players.length)return null;
			return Players[index];
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
		this.Next_Player = function()
		{
			if(this.Game_Over)return;
			cur_player++;
			while(Players[cur_player%Players.length].Dead)cur_player++;
			if(cur_player>=Players.length)
			{
				cur_player = 0;
				turn++;
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
		this.Move = function(unit, x, y, path, whenFinished, scrollTo)
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
			return unit.Act(x, y, path, whenFinished, scrollTo);
		};
		this.Build = function(city, input, whenFinished, scrollTo)
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
			return city.Act(input, whenFinished, scrollTo);
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

		this.Data = function()
		{
			var self = this;
			var player_data = [];
			for(var i in Players)
			{
				player_data.push(Players[i].Data());
			}
			let weather_clone = [];
			for(let i in self.Weather)
			{
				weather_clone[i] = self.Weather[i];
			}
			return {
				Game_Engine:true,
				valid:self.Valid,
				name:self.Name,
				turn:self.Turn,
				Terrain:terre.Clone(),
				weather:weather_clone,
				cur_player:cur_player,
				connected:Connected_Players,
				players:player_data
			};
		};
		this.Clone = function()
		{
			return new Engine_Data(this.Data());
		};

		var Units = [];
		var Cities = [];
		var Players = [];
		var Connected_Players = data.connected;
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
};

var Engine_Class = function(input, is_sample)
{
	var UI = Fast_Fake_Interface;
	this.Interface = UI;
	let __server_passkey; // needs to be sent for server to accept task
	this.Set_Passkey = function(key)
	{
		__server_passkey = key;
	};


	let _self = this;
	let last_move_time = new Date(),
		last_timeout;
	const	MAX_MOVE_DELAY_TIME = 60000;
	const AI_HALTED_CORRECTION = MAX_MOVE_DELAY_TIME/4;
	function sentGameMove()
	{	// if player doesn't move for a whole minute, force end their turn
		if(!online)return;
		last_move_time = new Date();
		const this_move_time = last_move_time;

		clearLastTimeoutCheck();
			// this isn't nessisary, it just might be more memory effecient

		if(_self.AI_Players().includes(_self.Active_Player()))
		{
			last_timeout = setTimeout(function(){
				if(last_move_time==this_move_time)
				{	// fix AI stalling issue by ending their turn
					if(last_move_time==this_move_time)
					{	// force player to end their turn
						_self.Active_Player().End_Turn();
					}
				} // because they haven't moved for a whole minute
			}, AI_HALTED_CORRECTION);
			return;
		}

		last_timeout = setTimeout(function(){
			if(last_move_time==this_move_time)
			{ // warn that user has 15 seconds to make a move
				LOG.add((client==_self.Active_Player() ? "You" : "They")+" have 15 seconds to make another move", "#F00", 10000);
				last_timeout = setTimeout(function(){
					if(last_move_time==this_move_time)
					{	// force player to end their turn
						if(client!=_self.Active_Player())return;
						_self.Send_Move('next player', JSON.stringify(_self.Data(true)));
						_self.Active_Player().End_Turn();
					}
				}, MAX_MOVE_DELAY_TIME/4);
			} // because they haven't moved for a whole minute
		}, MAX_MOVE_DELAY_TIME*3/4);
	};
	function clearLastTimeoutCheck()
	{	// only to be used when ending and starting new turns
		if(last_timeout!=null)
		{	// clear out the last time check
			clearTimeout(last_timeout);
		}
	}

	this.Send_Move = function(type, arg1, arg2, arg3, arg4)
	{
		if(!online)return;
		socket.emit(type, __server_passkey, arg1, arg2, arg3, arg4);
		if(type=='send move' || type=='send build')sentGameMove();
	};
	this.Send_Chat = function(msg)
	{
		if(!online)return;
		window.parent.send_chat(__server_passkey, msg);
	};
	this.Update_Server_With_Gamestate = function()
	{
		if(!online)return;
		socket.emit('save game', __server_passkey, JSON.stringify(this.Data(true)));
	};

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
	var global_weather;
	this.Terrain_Map = terre;
	this.Units_Map = units;
	this.Cities_Map = cities;
	this.Weather = global_weather;
	this.Name = null;
	this.Game_Over = false;
	this.Map = null; // this should be game data id key in server database
	this.id = null; // this should be game index in server
	this.valid = true;
	this.game_data = [false,input,0];

	this.Set_Interface = function(ui)
	{
		UI = ui;
		this.Interface = ui;
	}
	this.End_Game = function(client_won)
	{
		this.Game_Over = true;
		if(UI!=Fast_Fake_Interface)
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
		let self = this;
		setTimeout(function(){
			if(self.game_data[0]!=false)
			{
				if(UI!=Fast_Fake_Interface)
					UI.End_Game();
				openMapEditor(self.game_data[1], self.game_data[2], client_won);
			}
			else if(UI!=Fast_Fake_Interface)
				UI.End_Game(Players, turn);
			self.game_data = [false,input,0];
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
			let tile_height = this.Terrain_Map.At(u.X, u.Y).Height,
				stop_direction = [false, false, false, false],
				impeded_tiles = [];

			for(let l in list)
			{
				t = this.Terrain_Map.At(u.X+list[l][0], u.Y+list[l][1]);
				if(t==null)continue;
				if(l<5)
				{	// can see tile next to unit no matter what
					t = this.Units_Map.At(u.X, u.Y);
					if(t==null)continue;
					if(t.Player==_player)continue;
					if(data.includes(t))continue;
					data.push(t);
					continue;
				}

				if(u.Radar() || u.Unit_Type==1)
				{	// radar units can see thru high/dense terrain
					t = this.Units_Map.At(u.X, u.Y);
					if(t==null)continue;
					if(t.Player==_player)continue;
					if(data.includes(t))continue;
					data.push(t);
					continue;
				}

				if(tile_height<t.Height || t.Source==3)
				{
					impeded_tiles.push([list[l][0], list[l][1]]);
					continue;
				}

				for(var tile_check in impeded_tiles)
				{
					if(list[l][0]<0 && list[l][1]==0)	// pure left
					if(impeded_tiles[tile_check][0]<0 && impeded_tiles[tile_check][1]==0)
					if(impeded_tiles[tile_check][0]<list[l][0])
					{
						continue;
					}
					if(list[l][1]<0 && list[l][0]==0)	// pure up
					if(impeded_tiles[tile_check][1]<0 && impeded_tiles[tile_check][0]==0)
					if(impeded_tiles[tile_check][1]<list[l][1])
					{
						continue;
					}
					if(list[l][0]>0 && list[l][1]==0)	// pure right
					if(impeded_tiles[tile_check][0]>0 && impeded_tiles[tile_check][1]==0)
					if(impeded_tiles[tile_check][0]<list[l][0])
					{
						continue;
					}
					if(list[l][1]>0 && list[l][0]==0)	// pure down
					if(impeded_tiles[tile_check][1]>0 && impeded_tiles[tile_check][0]==0)
					if(impeded_tiles[tile_check][1]<list[l][1])
					{
						continue;
					}

					if(list[l][0]<0 && list[l][1]<0)	// North West
					if(impeded_tiles[tile_check][0]<0 && impeded_tiles[tile_check][1]<0)
					if(impeded_tiles[tile_check][0]<=list[l][0])
					if(impeded_tiles[tile_check][1]<=list[l][1])
					{
						continue;
					}
					if(list[l][0]<0 && list[l][1]>0)	// North East
					if(impeded_tiles[tile_check][0]<0 && impeded_tiles[tile_check][1]>0)
					if(impeded_tiles[tile_check][0]<=list[l][0])
					if(impeded_tiles[tile_check][1]<=list[l][1])
					{
						continue;
					}
					if(list[l][0]>0 && list[l][1]>0)	// South East
					if(impeded_tiles[tile_check][0]>0 && impeded_tiles[tile_check][1]>0)
					if(impeded_tiles[tile_check][0]<=list[l][0])
					if(impeded_tiles[tile_check][1]<=list[l][1])
					{
						continue;
					}
					if(list[l][0]>0 && list[l][1]<0)	// South West
					if(impeded_tiles[tile_check][0]>0 && impeded_tiles[tile_check][1]<0)
					if(impeded_tiles[tile_check][0]<=list[l][0])
					if(impeded_tiles[tile_check][1]<=list[l][1])
					{
						continue;
					}
				}

				t = this.Units_Map.At(u.X, u.Y);
				if(t==null)continue;
				if(t.Player==_player)continue;
				if(data.includes(t))continue;
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
		let t, list = Core.Target.Diamond(_unit.Sight);

		let tile_height = this.Terrain_Map.At(_unit.X, _unit.Y).Height,
			impeded_tiles = [];

		for(let l in list)
		{
			t = this.Terrain_Map.At(_unit.X+list[l][0], _unit.Y+list[l][1]);
			if(t==null)continue;
			if(l<5)
			{	// can see tile next to unit no matter what
				t.Hidden = false;
				continue;
			}

			if(_unit.Radar() || _unit.Unit_Type==1)
			{	// radar units can see thru high/dense terrain
				t.Hidden = false;
				continue;
			}

			if(tile_height<t.Height || t.Source==3)
			{
				impeded_tiles.push([list[l][0], list[l][1]]);
				continue;
			}

			for(var tile_check in impeded_tiles[tile_check])
			{
				if(list[l][0]<0 && list[l][1]==0)	// pure left
				if(impeded_tiles[tile_check][0]<0 && impeded_tiles[tile_check][1]==0)
				if(impeded_tiles[tile_check][0]<list[l][0])
				{
					continue;
				}
				if(list[l][1]<0 && list[l][0]==0)	// pure up
				if(impeded_tiles[tile_check][1]<0 && impeded_tiles[tile_check][0]==0)
				if(impeded_tiles[tile_check][1]<list[l][1])
				{
					continue;
				}
				if(list[l][0]>0 && list[l][1]==0)	// pure right
				if(impeded_tiles[tile_check][0]>0 && impeded_tiles[tile_check][1]==0)
				if(impeded_tiles[tile_check][0]<list[l][0])
				{
					continue;
				}
				if(list[l][1]>0 && list[l][0]==0)	// pure down
				if(impeded_tiles[tile_check][1]>0 && impeded_tiles[tile_check][0]==0)
				if(impeded_tiles[tile_check][1]<list[l][1])
				{
					continue;
				}

				if(list[l][0]<0 && list[l][1]<0)	// North West
				if(impeded_tiles[tile_check][0]<0 && impeded_tiles[tile_check][1]<0)
				if(impeded_tiles[tile_check][0]<=list[l][0])
				if(impeded_tiles[tile_check][1]<=list[l][1])
				{
					continue;
				}
				if(list[l][0]<0 && list[l][1]>0)	// North East
				if(impeded_tiles[tile_check][0]<0 && impeded_tiles[tile_check][1]>0)
				if(impeded_tiles[tile_check][0]<=list[l][0])
				if(impeded_tiles[tile_check][1]<=list[l][1])
				{
					continue;
				}
				if(list[l][0]>0 && list[l][1]>0)	// South East
				if(impeded_tiles[tile_check][0]>0 && impeded_tiles[tile_check][1]>0)
				if(impeded_tiles[tile_check][0]<=list[l][0])
				if(impeded_tiles[tile_check][1]<=list[l][1])
				{
					continue;
				}
				if(list[l][0]>0 && list[l][1]<0)	// South West
				if(impeded_tiles[tile_check][0]>0 && impeded_tiles[tile_check][1]<0)
				if(impeded_tiles[tile_check][0]<=list[l][0])
				if(impeded_tiles[tile_check][1]<=list[l][1])
				{
					continue;
				}
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
	this.Move = function(unit, x, y, path, whenFinished, scrollTo)
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
		return unit.Act(x, y, path, whenFinished, scrollTo);
	};
	this.Build = function(city, input, whenFinished, scrollTo)
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
		return city.Act(input, whenFinished, scrollTo);
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
		var available = input.Terrain().Mods_By_Type("Properties");
		for(var i=0;i<available.length;i++)
		{
			available[i].Do(input);
		}
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
	};
	this.Start = function()
	{
		currently_playing = true;
		if(UI!=Fast_Fake_Interface)
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
						sentGameMove();
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

	this.Data = function(string)
	{	/// create a clone of the data for the current game state
		var self = this;
		var player_data = [];
		for(var i in Players)
		{
			player_data.push(Players[i].Data());
		}
		let weather_clone = [];
		for(let i in global_weather)
		{
			weather_clone[i] = global_weather[i];
		}
		let terrain_data;
		if(string)
		{
			terrain_data = "";
			for(let x=0;x<terre.Width;x++)
			for(let y=0;y<terre.Height;y++)
				terrain_data+=terre.At(x, y).Source+".";
		}else terrain_data = terre.Clone();
		return {
			Game_Engine:true,
			valid:self.valid,
			name:self.Name,
			turn:turn,
			Terrain:terrain_data,
			weather:weather_clone,
			cur_player:cur_player,
			connected:Connected_Players,
			players:player_data
		};
	};
	this.Clone = function()
	{	/// creates a game-data engine that follows this game's exact state and runs like a Fake game without display or timing
		return new Engine_Data(this.Data());
	};
	this.Restart = function()
	{
		if(UI!=Fast_Fake_Interface)
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
			if(UI!=Fast_Fake_Interface)
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
				Players[i].Kill_All();
			}
			var self = this;
			self.Game_Over = true;
			if(UI!=Fast_Fake_Interface)
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
	this.Player = function(index)
	{
		if(index>=Players.length)return null;
		return Players[index];
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
	this.Next_Player = function(ignore_controls)
	{
		if(this.Game_Over)return;

		if(UI!=Fast_Fake_Interface)
		{
			if(!UI.Check_Controls() && !ignore_controls)return;
			SFXs.Stop_Loops();
		}

		clearLastTimeoutCheck();
		cur_player++;
		while(Players[cur_player%Players.length].Dead)cur_player++;
		if(cur_player>=Players.length)
		{
			cur_player = 0;
			turn++;
		}

		if(UI!=Fast_Fake_Interface)
		{
			var active_player = Players[cur_player];
			var self = this;
			UI.Select_Tile();
			UI.Set_Next_Player(active_player, function(){
				active_player.Start_Turn(socket.index==Connected_Players[cur_player], function(){
					sentGameMove();
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

	let t0 = performance.now();
	if(input!=null)
	{			/// when input is new map data or map id--make new game
		let draw_map_data = function(self, __terre){

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
							if(i==xtra_size)
							if(index==5 || index==6)
								index-=2;
							if(paint_off_map[x+xtra_size-i][y+xtra_size]==null)
								paint_off_map[x+xtra_size-i][y+xtra_size] = index;

							if(j==0)continue;
							if(paint_off_map[x+xtra_size-i].length>y+xtra_size+j)
							if(paint_off_map[x+xtra_size-i][y+xtra_size+j]==null)
								paint_off_map[x+xtra_size-i][y+xtra_size+j] = index;
							if(0<=y+xtra_size-j)
							if(paint_off_map[x+xtra_size-i][y+xtra_size-j]==null)
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
							if(i==xtra_size)
							if(index==5 || index==6)
								index-=2;
							if(paint_off_map[x+xtra_size+i][y+xtra_size]==null)
								paint_off_map[x+xtra_size+i][y+xtra_size] = index;

							if(j==0)continue;
							if(paint_off_map[x+xtra_size+i].length>y+xtra_size+j)
							if(paint_off_map[x+xtra_size+i][y+xtra_size+j]==null)
								paint_off_map[x+xtra_size+i][y+xtra_size+j] = index;
							if(0<=y+xtra_size-j)
							if(paint_off_map[x+xtra_size+i][y+xtra_size-j]==null)
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
							if(i==xtra_size)
							if(index==5 || index==6)
								index-=2;
							if(paint_off_map[x+xtra_size][y+xtra_size-i]==null)
								paint_off_map[x+xtra_size][y+xtra_size-i] = index;

							if(j==0)continue;
							if(paint_off_map.length>x+xtra_size+j)
							if(paint_off_map[x+xtra_size+j][y+xtra_size-i]==null)
								paint_off_map[x+xtra_size+j][y+xtra_size-i] = index;
							if(0<=x+xtra_size-j)
							if(paint_off_map[x+xtra_size-j][y+xtra_size-i]==null)
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
							if(i==xtra_size)
							if(index==5 || index==6)
								index-=2;
							if(paint_off_map[x+xtra_size][y+xtra_size+i]==null)
								paint_off_map[x+xtra_size][y+xtra_size+i] = index;

							if(j==0)continue;
							if(paint_off_map.length>x+xtra_size+j)
							if(paint_off_map[x+xtra_size+j][y+xtra_size+i]==null)
								paint_off_map[x+xtra_size+j][y+xtra_size+i] = index;
							if(0<=x+xtra_size-j)
							if(paint_off_map[x+xtra_size-j][y+xtra_size+i]==null)
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
					map[x][y] = new Terrain.Terre_Class(self,index,"Terrain("+x+","+y+")",x,y,_sprite_id);
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
					outside_map[x][y] = new Terrain.Terre_Class(self,index,"Outside("+x+","+y+")",-1,-1, _sprite_id);
				}
			}
			self.Terrain_Map = new Map_Holder(map);
			self.Units_Map = new Map_Holder(Blank_Map(self.Terrain_Map.Width, self.Terrain_Map.Height));
			self.Cities_Map = new Map_Holder(Blank_Map(self.Terrain_Map.Width, self.Terrain_Map.Height));

			terre = self.Terrain_Map;
			units = self.Units_Map;
			cities = self.Cities_Map;
			self.Paint_Off_Map = outside_map;
			self.map_source_data = __terre;
		};

		if(input.Valid)
		{		/// input is map_data
	console.time("parse data");
			var data = Levels.Play_Custom(this, input);
			var __terre = data[0];
			var __units = data[1];
			var __cities = data[2];
			if(__terre==null)return;
			global_weather = data[3];
			this.Weather = global_weather;
	console.timeEnd("parse data");

	console.time("preparing map");
			draw_map_data(this, __terre);
	console.timeEnd("preparing map");

	console.time("initalizing assets");
			for(var i in __units)
			{
				this.Add_Unit(Characters.New(this,Char_Data.Reverse_Get(__units[i][0]).Name), __units[i][1], __units[i][2], __units[i][3]);
			}
			for(var i in __cities)
			{
				this.Add_Building(Buildings.New(this,Building_Data.Reverse_Get(__cities[i][0]).Name), __cities[i][1], __cities[i][2], __cities[i][3]);
			}
	console.timeEnd("initalizing assets");

		}
		else console.error("oh this is BAD",input);
		/** else if(typeof(input)==='string')
		{		/// when input is data from existing game -> load gamestate
	console.time("parse data");
			var data = JSON.parse(input);

			//// run DATA CHANGE

console.log(data);



			this.id = data.id;
			this.Map = data.map;
			this.Name = data.name;
			turn = data.turn;
			cur_player = data.cur_player;
			global_weather = [false,false,false];
			this.Weather = global_weather;
			var old_map = Clone_Map(Levels.Terrain.Data(data.map));

	console.timeEnd("parse data");
			if(old_map==null)return;

	console.time("preparing map");
			draw_map_data(this, old_map);
	console.timeEnd("preparing map");

	console.time("initalizing assets");
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
	console.timeEnd("initalizing assets");
		}
		else if(input.Name==null)
		{		/// input is a local map id
	console.time("parse data");
			this.Map = input;
			this.id = -1;
			var old_map = Clone_Map(Levels.Terrain.Data(input));
			if(old_map==null)return;
			global_weather = [false, false, false];
			this.Weather = global_weather;
	console.timeEnd("parse data");

	console.time("preparing map");
			draw_map_data(this, old_map);
	console.timeEnd("preparing map");

	console.time("initalizing assets");
			Levels.Run(this, input);
	console.timeEnd("initalizing assets");
} */
	}
	else this.valid = false; // game does not have valid input to function
	let t1 = performance.now();
};
