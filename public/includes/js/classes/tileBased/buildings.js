var Buildings = {
	Build_Class:function(game, place_index)
	{
		function err(txt)
		{
			console.error("Building of "+place_index+" at ("+this.X+", "+this.Y+"): "+txt);
		}
		this.SELECTABLE = 3;

		var BuildData = Building_Data.PLACE[place_index];
		var actions = [];
		var select_animation = Select_Animation.New(animationCanvas, -TILESIZE, -TILESIZE, TILESIZE, TILESIZE, false);
		this.Description = function()
		{
			return BuildData.Description;
		};
		this.Index = null;

		this.Name = BuildData.Name;
		this.Owner = null;
		this.Terrain = null;

		var self = this;
		this.Type = BuildData.Type;
		this.Protection = BuildData.Protection;
		this.Stature = {
			value:BuildData.Stature,
			Get:function(){
					return this.value;
			},
			Set:function(_v){
				this.value = _v;
				game.Interface.Draw();
			}
		};
		this.Defense = BuildData.Defense;
		this.Injuries = BuildData.Injuries;
		this.Height = BuildData.Height;
		this.Drag = BuildData.Drag;
		this.Source = place_index;
		this.Sprite = null;
		this.Resources = BuildData.Resources;
		this.Income = BuildData.Income;
		this.X;
		this.Y;
		this.X_Offset = function()
		{
			return BuildData.X;
		};
		this.Y_Offset = function()
		{
			return BuildData.Y;
		};
		this.Data = function()
		{	// returns a clone of the data
			var self = this;
			let data = {
				index:place_index,
				x:self.X,
				y:self.Y,
				stature:self.Stature,
				resources:self.Resources
			};
			let extra_mods = [];
			for(let i=0;i<mods.length;i++)
			{
				if(!BuildData.Modifiers.includes(mods[i]))
					extra_mods.push(mods[i]);
			}
			if(extra_mods.length>0)
				data.mods = extra_mods;
			return data;
		};

		var mods = Core.Array.Clone(BuildData.Modifiers);
		var mod_amt = mods.length;
		this.Mods_By_Type = function(type)
		{
			var cur = [];
			for(var i=0;i<mod_amt;i++)
			{
				if(mods[i].Type==type)
					cur.push(mods[i]);
			}
			return cur;
		};
		this.Modifier_Amt = function()
		{
			return mod_amt;
		};
		this.Modifier = function(i)
		{
			if(i<mod_amt&&i>=0)
				return mods[i];
			err("Not a valid index");
			return null;
		};
		this.Add_Modifier = function(value)
		{
			mods[mod_amt++] = value;
		};
		this.Del_Modifier = function(value)
		{
			if(i<mod_amt&&i>=0)
				mods[value] = mods[--mod_amt];
			err("Not a valid index");
		};

		this.Draw = function(canvas, x, y)
		{
			if(this.Sprite==null || this.Terrain.Hidden)
			{
				var img = BuildData.Sprite.Image();
				BuildData.Sprite.Draw(canvas,x,y,img.width*TILESIZE/60,img.height*TILESIZE/60);
			}
			else
			{
				canvas.putImageData(this.Sprite, x, y);
			}
		};
		this.UI_Draw = function(canvas, x, y)
		{
			this.Draw(canvas,x+(TILESIZE/60*this.X_Offset()),y+(TILESIZE/60*this.Y_Offset()));

			if(this.Terrain.Hidden)return;

			canvas.save();
			canvas.translate(x,y);
			canvas.scale(TILESIZE/60,TILESIZE/60);
			if(this.Active)
			{
				select_animation.set({
					show:true,
					x:x,
					y:y
				});
			}
			if(this.Stature.Get()!=BuildData.Stature)
			{
				var percent = this.Stature.Get()/BuildData.Stature;
				if(percent<0)
					percent = 0;
				var height = TILESIZE*(1-percent);
				Team_Colors.Draw(canvas, 50, height, TILESIZE-height, this.Owner);
			}
			if(this.Resources!=0)
			{
				game.Interface.Resource_Draw(canvas, this.Resources);
			}
			canvas.restore();
		};
		this.Hide_Animation_Display = function()
		{
			select_animation.set({
				show:false
			});
		};

		this.Active = false;
		this.Set_Active = function(value)
		{
			if(BuildData.Act==null)return;
			this.Active = value;
			select_animation.set({show:value});
		};
		this.Act = function(input, callback, scrollTo)
		{
			if(BuildData.Act==null)
			{
				if(callback!=null)callback(this);
				return null;
			}
			if(scrollTo)game.Interface.Scroll_To_Tile(this.X, this.Y);
			return BuildData.Act(game, this, input, callback);
		};

		this.Start_Turn = function(client)
		{
			if(client)
			{
				if(BuildData.Act)
				{
					this.Set_Active(true);
				}
			}
			else
			{
				if(BuildData.Act)
				{
					this.Active = true;
				}
			}
			var available = this.Mods_By_Type("Start Turn");
			for(var i=0;i<available.length;i++)
			{
				available[i].Do(this);
			}
			if(raiding_player!=null)
			if(this.Terrain.Unit==null||this.Terrain.Unit.Player!=raiding_player)
			{
				this.Stature.Set(BuildData.Stature);
				raiding_player = null;
			}
			var amt = Math.min(this.Resources, this.Income);
			if(amt!=0)
			{
				this.Resources-=amt;
				if(this.Owner==null)return;
				this.Owner.Add_Income(amt);
				if(game.Interface.Fake)return;
				if(this.Terrain.Hidden)return;
				game.Interface.Income_Draw(this.X, this.Y, amt);
			}
		};
		this.End_Turn = function(stop_auto_check)
		{
			if(this.Active)
			{
				select_animation.set({
					show:false
				});
			}
			this.Set_Active(false);
			if(!stop_auto_check)
			if(!~this.Owner.Next_Active_Unit())
			if(!~this.Owner.Next_Active_Building())
			{
				this.Owner.End_Turn();
			}
		};

		this.Clone = function(engine)
		{
			return new Build_Class(engine,place_index,x,y);
		};

		var raiding_player = null;
		this.Raid = function(unit, amt)
		{
			var self = this;
			INTERFACE.Scroll_To_Tile(self.X, self.Y);
			raiding_player = unit.Player

			Core.Smooth_Changer(this, self.Stature, -amt/10, 10, function(){
				if(self.Stature.Get()<=0)
				{
					self.Stature.Set(BuildData.Stature);
					unit.Player.Capture(self);
				}
				else
				{
					unit.Player.Raiding_Cities.push(self);
					if(self.Owner!=null)unit.Hurt(self.Defense);
				}
			});

			game.Interface.Draw();
		};
		this.Captured_By = function(player)
		{
			var available = this.Mods_By_Type("Capture");
			for(var i=0;i<available.length;i++)
			{
				available[i].Do([this, player]);
			}
		};
		this.Die = function()
		{
			this.Owner = null;
			Core.Explode(this);
		};
		this.Remove_From_Game = function()
		{
			if(this.Owner!=null)
				this.Owner.Lose_Building(this);
		};

		this.Action_Amt = function()
		{
			return actions.length;
		}
		this.Action = function(i)
		{
			return actions[i];
		}
		this.Add_Action = function(value)
		{
			actions.push(value);
		}
		this.Del_Action = function(value)
		{
			var found = false;
			var last_index;
			for(var i in actions)
			{
				if(index!=i.substring(2,i.length))
				{
					if(found)
					{
						actions[last_index] = actions[i];
						last_index = i;
					}
					continue;
				}
				if(i.substring(0,2)=="A_")
				{
					delete actions[i];
					found = true;
					last_index = i;
				}
			}
			if(!found)
			{
				err("Could not find index to delete.");
			}
		}
	},
	New:function(Game, name)
	{
		var index = Building_Data.Get(name);
		if(index==0)
		{
			console.log(name+" is not a proper terrain name.");
		}
		return new Buildings.Build_Class(Game,index);
	}
};
