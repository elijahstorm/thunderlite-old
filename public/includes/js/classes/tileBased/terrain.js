/// Code written and created by Elijah Storm
// Copywrite April 5, 2020
// for use only in ThunderLite Project


var Terrain = {
	Terre_Class:function(game, terre_index, name, x, y, __sprite)
	{
		function err(txt)
		{
			console.error(name+" of "+terre_index+": "+txt);
		}
		this.SELECTABLE = 2;

		var TerreData = Terrain_Data.TERRE[terre_index];
		var mods = Core.Array.Clone(TerreData.Modifiers);
		var mod_amt = mods.length;

			// to display correct sprite
		var sprite,draw_image=false;

		if(__sprite!=null)
		{
			if(TerreData.Connnection==3)
			{	// if has borders, then display it right
				sprite = __sprite[0].New(worldCanvas, x*TILESIZE, y*TILESIZE, TILESIZE, TILESIZE, true);
			}else if(TerreData.Connnection==5)
			{
				sprite = __sprite[0].New(worldCanvas, x*TILESIZE, y*TILESIZE, TILESIZE, TILESIZE, true);
			}else sprite = __sprite;
			if(sprite.Image!=null)
			{
				draw_image = true;
			}
		}

		this.Building = null;
		this.Unit = null;

		this.Name = TerreData.Name;
		this.Type = TerreData.Type;
		this.Protection = TerreData.Protection;
		this.Damage = TerreData.Damage;
		this.Height = TerreData.Height;
		this.Drag = TerreData.Drag;
		this.Surface = TerreData.Terrain;
		this.Source = terre_index;
		this.X = x;
		this.Y = y;
		this.X_Offset = function()
		{
			return TerreData.X;
		};
		this.Y_Offset = function()
		{
			return TerreData.Y;
		};


		this.Draw = function(canvas, x, y, duplicate)
		{
			if(TerreData.Connnection==3 || TerreData.Connnection==5)
			{
				if(duplicate)
				{
					TerreData.Sprite[0].Draw(canvas, x, y, TILESIZE, TILESIZE);
					if(__sprite[1]!=null)
						canvas.putImageData(merge(canvas.getImageData(x, y, __sprite[1].width, __sprite[1].height), __sprite[1]), x, y);
					return;
				}
				sprite.set({
					show:true,
					x:x,
					y:y
				});
				if(__sprite[1]!=null)
					canvas.putImageData(__sprite[1], x, y);
				return;
			}
			if(draw_image)
			{
				sprite.Draw(canvas, x, y, TILESIZE, sprite.Image().height*TILESIZE/60);
				return;
			}

			canvas.putImageData(sprite, x, y);
		};
		this.UI_Draw = function(canvas, x, y, duplicate)
		{
			this.Draw(canvas,x+this.X_Offset(),y+this.Y_Offset()*(TILESIZE/60),duplicate);

			if(duplicate)return;

			if(this.pointer!=null)
			{
				this.pointer.set({
					show:true,
					x:x,
					y:y
				});
			}

			if(this.Hidden)
			{
				canvas.save();
				canvas.translate(x, y);
				canvas.globalAlpha = this.Alpha.data;
				Terrain_Data.Fog.Draw(canvas, 0, 0, TILESIZE, TILESIZE);
				canvas.restore();
			}
				/// show tile location
			// devCanvas.save();
			// devCanvas.translate(x, y);
			// new Text_Class("7pt Times New Roman","#ddd").Draw(devCanvas, 5, 3, 56, 10, "("+this.X+", "+this.Y+")");
			// devCanvas.restore();
		};
		this.Hide_Animation_Display = function()
		{
			if(this.pointer!=null)
			{
				this.pointer.set({
					show:false
				});
			}
			if(sprite.set==null)return;
			sprite.set({
				show:false
			});
		};

		this.Start_Turn = function()
		{
			if(this.Building!=null)
				this.Building.Start_Turn();
		};

		this.Description = function()
		{
			return TerreData.Description;
		};
		this.Sprite = function()
		{
			return TerreData.Sprite[0];
		};
		this.Index = function()
		{
			return index;
		};

		this.Clone = function(engine)
		{
			return new Terrain.Terre_Class(engine,terre_index,x,y);
		};
		this.Delete = function()
		{
			if(TerreData.Connnection==3)
			{
				__sprite[0].Remove(sprite.values.index);
			}
		};

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
		}
		this.Modifier = function(i)
		{
			if(i<mod_amt&&i>=0)
				return mods[i];
			err("Not a valid index");
			return null;
		}
		this.Add_Modifier = function(value)
		{
			mods[mod_amt++] = value;
		}
		this.Del_Modifier = function(value)
		{
			if(i<mod_amt&&i>=0)
				mods[value] = mods[--mod_amt];
			err("Not a valid index");
		}
	},
	New:function(Game, name, x, y, sprite_id)
	{
		var index = Terrain_Data.Get(name);
		if(index==0)
		{
			console.log(name+" is not a proper terrain name.");
		}
		return new Terrain.Terre_Class(Game,index,"Terrain("+x+","+y+")",x,y, sprite_id);
	}
};
