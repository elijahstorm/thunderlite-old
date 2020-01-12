var Player_Class = function(game, name, team, colors)
{
	var self = this;
	self.data = {
		damage_delt:0,
		damage_received:0,
		units_gained:0,
		units_killed:0,
		money_gained:0,
		money_spent:0,
		turns_alive:0,
		buildings_captured:0,
		buildings_lost:0
	};

	var Units = [];
	var Buildings = [];
	var charSprites = new Array(Char_Data.CHARS.length);
	var placeSprites = new Array(Building_Data.PLACE.length);
	self.Color = colors;
	self.Game = game;

	if(colors!=-1)
	{
		imageHolderCanvas.clearRect(0,0,imageHolderCanvas.width,imageHolderCanvas.height);

		for(var x=0;x<Char_Data.CHARS.length;x++)
		{
			charSprites[x] = [];
			for(var y=0;y<3;y++)
			{
				var img = Char_Data.CHARS[x].Sprite[y];
				img.Draw(imageHolderCanvas,0,0);
				charSprites[x][y] = scale(changePixels(imageHolderCanvas.getImageData(0,0,img.Image().width,img.Image().height), Team_Colors.Color[0], Team_Colors.Color[colors]), TILESIZE/60, TILESIZE/60);
				imageHolderCanvas.clearRect(0,0,img.Image().width,img.Image().height);
			}
			var c = Char_Data.CHARS[x];
			var img = c.Sprite[0];
			c.X[3] = 60-img.Image().width-c.X[0];
			c.Y[3] = c.Y[0];
			img.Draw(imageHolderCanvas,0,0);
			charSprites[x][3] = scale(flipX(changePixels(imageHolderCanvas.getImageData(0,0,img.Image().width,img.Image().height), Team_Colors.Color[0], Team_Colors.Color[colors])), TILESIZE/60, TILESIZE/60);
			imageHolderCanvas.clearRect(0,0,img.Image().width,img.Image().height);
		}
		for(var x=0;x<Building_Data.PLACE.length;x++)
		{
			var img = Building_Data.PLACE[x].Sprite;
			img.Draw(imageHolderCanvas,0,0);
			placeSprites[x] = scale(changePixels(imageHolderCanvas.getImageData(0,0,img.Image().width,img.Image().height), Team_Colors.Color[0], Team_Colors.Color[colors]), TILESIZE/60, TILESIZE/60);
			imageHolderCanvas.clearRect(0,0,img.Image().width,img.Image().height);
		}

		self.Icon = Images.Retrieve("Player Face"+(colors-1));
	}

	self.Name = name;
	self.Team = team;
	self.Game = game;
	self.Dead = false;
	self.Data = function()
	{	// returns a clone of the data
		var units_data = [];
		var build_data = [];
		for(var i in Units)
		{
			if(Units[i].Rescued_Unit!=null)
			{
				if(units_data.indexOf(Units[i].Rescued_Unit)!=-1)
					units_data[units_data.indexOf(Units[i].Rescued_Unit)] = Units[i].Data();
				else return "CAUGHT ERROR: Rescued_Unit reference invalid";
				continue;
			}
			units_data.push(Units[i].Data());
		}
		for(var i in Buildings)
		{
			build_data.push(Buildings[i].Data());
		}
		return {
			name:self.Name,
			color:colors,
			data:self.data,
			units:units_data,
			buildings:build_data
		};
	};

	var disallowed_units = [12,13,14,18,24];
	var controls = [0,0,0];
	var resources = 0;

	self.Raiding_Cities = [];
	self.Active = false;
	function startUnitRecursive(actable, i, callback)
	{
		if(i>=Units.length)
		{
			game.Interface.Draw();
			callback();
			return;
		}
		Units[i].Start_Turn(actable, function(){
			startUnitRecursive(actable, i+1, callback);
		});
		if(game.Game_Over)
		{
			game.Interface.Draw();
			callback();
			return;
		}
	}
	self.Start_Turn = function(actable, callback)
	{
		self.data.turns_alive++;
		self.Active = true;
		if(Units[0]!=null)
			game.Interface.Scroll_To_Tile(Units[0].X, Units[0].Y);
		setTimeout(function(){
			startUnitRecursive(actable, 0, callback);
		}, 10);
		for(var i=0;i<self.Raiding_Cities.length;i++)
		{
			var city = self.Raiding_Cities[i];
			var __unit = game.Units_Map.At(city.X, city.Y);
			if(__unit!=null)
			if(__unit.Player==self)continue;

			self.Raiding_Cities.splice(i--, 1);
		}
		for(var i in Buildings)
		{
			Buildings[i].Start_Turn(actable);
			if(game.Game_Over)
				return;
		}
	};
	self.End_Turn = function()
	{
		if(!self.Active)return;
		self.Active = false;
		for(var i in Units)
		{
			Units[i].End_Turn(true, true);
			if(game.Game_Over)
				return;
		}
		for(var i in Buildings)
		{
			Buildings[i].End_Turn(true);
			if(game.Game_Over)
				return;
		}
		game.Next_Player(true);
	};

	self.Add_Income = function(value)
	{
		if(value>0)
			self.data.money_gained+=value;
		else self.data.money_spent-=value;
		resources+=value;
		if(!game.Interface.Fake)
			game.Interface.Update_Player_Info();
	};
	self.Cash_Money = function()
	{
		return resources;
	};
	self.Can_Build = function(index, building)
	{
		if(resources<self.Calculate_Cost(index))
			return false;
		var _c = Char_Data.CHARS[index];
		if(_c==null)
			return false;
		if(_c.Type==0)
		if(!self.Ground_Control())
			return false;
		if(_c.Type==1)
		if(!self.Air_Control())
			return false;
		if(_c.Type==2)
		if(!self.Water_Control())
			return false;
		return _c.Type==building.Terrain.Surface || _c.Type==1;
	};

	self.Disallow_Unit = function(index)
	{
		for(var i in disallowed_units)
		if(disallowed_units[i]==index)
		{
			console.error("Unit not allowed to begin with!");
			return false;
		}
		disallowed_units.push(index);
		return true;
	};
	self.Reallow_Unit = function(index)
	{
		var pos = disallowed_units.indexOf(unit);
		if(~pos)
		{
			disallowed_units.splice(pos,1);
			return true;
		}
		console.error("No unit previously disallowed that match that index.");
		return false;
	};
	self.Disallowed = function()
	{
		var temp = [];
		for(var i=1;i<Char_Data.CHARS.length;i++)
		{
			if(controls[Char_Data.CHARS[i].Type]==0)
			{
				temp.push(i);
				continue;
			}
			for(var j=0;j<disallowed_units.length;j++)
			{
				if(i==disallowed_units[j])
				{
					temp.push(i);
					break;
				}
			}
		}
		return temp;
	};
	self.Buildable_Units = function()
	{
		var _units = [];
		var adable;
		for(var i=1;i<Char_Data.CHARS.length;i++)
		{
			if(controls[Char_Data.CHARS[i].Type]>0)
			{
				adable = true;
				for(var j=0;j<disallowed_units.length;j++)
				{
					if(i==disallowed_units[j])
					{
						adable = false;
						break;
					}
				}
				if(adable)
				{
					_units.push(i);
				}
			}
		}
		return _units;
	};
	self.Calculate_Cost = function(unit)
	{
		for(var i in disallowed_units)
		if(disallowed_units[i]==unit)
			return null;
		var discount = 1-controls[Char_Data.CHARS[unit].Type]*.05;
		return Math.ceil(Char_Data.CHARS[unit].Cost*discount);
	};
	self.Unit_Images = function()
	{
		return charSprites;
	};
	self.Check_Standing = function()
	{
		return game.Check_Player_Standing(team);
	};

	self.Kill_All = function()
	{
		setTimeout(function(){
			for(var i in Units)
			{
				Units[i].Die();
			}
			Units = [];
			for(var i in Buildings)
			{
				Buildings[i].Die();
			}
			Buildings = [];
		}, AI.TIMEOUT);
	};
	self.Units_Amount = function()
	{
		return Units.length;
	};
	self.Get_Unit = function(index)
	{
		return Units[index];
	};
	self.Get_Building = function(index)
	{
		return Buildings[index];
	};
	self.Building_Amount = function()
	{
		return Buildings.length;
	};
	self.Next_Active_Unit = function()
	{
		for(var i in Units)
		{
			if(Units[i].Active)return Units[i];
		}
		return -1;
	};
	self.Next_Active_Building = function()
	{
		for(var i in Buildings)
		{
			if(Buildings[i].Active)return Buildings[i];
		}
		return -1;
	};

	self.Lose = function()
	{
		self.Kill_All();
		game.Player_Died(self);
	};
	self.Win = function()
	{
		game.Player_Won(self);
	};

	self.Capture = function(input)
	{
		self.data.buildings_captured++;
		Buildings.push(input);
		input.Sprite = placeSprites[input.Source];
		input.Captured_By(self);
		if(input.Owner!=null)
		{
			input.Owner.Lose_Building(input);
		}
		input.Owner = self;
		game.City_Visibility(input);
		game.Interface.Draw();
	};
	self.Ground_Control = function()
	{
		return (controls[0]>0);
	};
	self.Air_Control = function()
	{
		return (controls[1]>0);
	};
	self.Sea_Control = function()
	{
		return (controls[2]>0);
	};
	self.Water_Control = function()
	{
		return (controls[2]>0);
	};
	self.Add_Control = function(type, gain)
	{
		if(type==null)return;
		if(gain==null)gain = true;
		if(type>2||type<0)
			return;
		if(gain)controls[type]++;
		else controls[type]--;
		if(controls[type]<0)controls[type]=0;
	};
	self.Lose_Building = function(input)
	{
		self.data.buildings_lost++;
		var pos = Buildings.indexOf(input);
		if(~pos)
		{
			Buildings.splice(pos,1);
			return true;
		}
		return false;
	}

	self.Add_Unit = function(input)
	{
		self.data.units_gained++;
		Units.push(input);
		input.Player = self;
		input.Sprites = charSprites[input.Source];
	};
	self.Remove_Unit = function(unit)
	{
		self.data.units_lost++;
		var pos = Units.indexOf(unit);
		if(~pos)
		{
			Units.splice(pos,1);
			for(var i in Units)
			{	// check to see if any units are alive that aren't turrets or walls
				if(Units[i].Source!=13 &&
					Units[i].Source!=14)
					return true;
			} // if there aren't any, the player lost the game
			setTimeout(function(){
				self.Lose();
			}, AI.TIMEOUT);
			return true;
		}
		return false;
	};
};
