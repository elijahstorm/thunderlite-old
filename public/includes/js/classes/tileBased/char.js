var Characters = {
	BadAttack:Images.Retrieve("Bad Attack"),
	OkayAttack:Images.Retrieve("Okay Attack"),
	GreatAttack:Images.Retrieve("Great Attack"),
	WeakDanger:Images.Retrieve("Danger0"),
	Danger:Images.Retrieve("Danger1"),
	StrongDanger:Images.Retrieve("Danger2"),
	Char_Class:function(game, char_index)
	{
		function err(txt)
		{
			console.error(name,this.Index,"->",txt);
		}
		this.SELECTABLE = 1;

		var CharData = Char_Data.CHARS[char_index];
		var name = CharData.Name;
		var attkSFX = CharData.AttackSFX;
		var moveSFX = CharData.MoveSFX;
		var repair_ani = Repair_Animation.New(animationCanvas, -TILESIZE, -TILESIZE, TILESIZE/3, TILESIZE/3, false);
		var select_animation = Select_Animation.New(animationCanvas, -TILESIZE, -TILESIZE, TILESIZE, TILESIZE, false);
		var mods = Core.Array.Clone(CharData.Modifiers);
		this.Description = function()
		{
			return CharData.Description;
		};
		this.Index = null;

		this.Terrain = function()
		{
			return game.Terrain_Map.At(this.X, this.Y);
		};

		this.Game = game;
		this.Name = name;
		this.Source = char_index;
		this.Unit_Type = CharData.Type;
		this.Max_Health = CharData.Max_Health;
		this.Health = CharData.Max_Health;
		this.Armor = CharData.Armor;
		this.Power = CharData.Power;
		this.Weapon = CharData.Weapon;
		this.Movement = CharData.Movement;
		this.Radar = function(){
			return CharData.Modifiers.includes(CURMODS.Move.Radar);
		};
		this.Resources = function(){
			return CharData.Modifiers.includes(CURMODS.Self_Action.Miner);
		};
		if(CharData.Cash)
			this.Cash = CharData.Cash;
		this.Tracking = function(){
			return CharData.Modifiers.includes(CURMODS.Move.Tracking);
		};
		this.Move_Type = CharData.Move_Type;
		this.Slow_Attack = CharData.Slow; // can or can't move and attack on the same turn
		this.Range = Core.Array.Clone(CharData.Range);
		this.Sight = CharData.Sight;
		var Additional_Display = null;
		var WEAKNESSTEXT = new Text_Class("15pt Verdana", "#000");
		var STRENGTHTEXT = new Text_Class("15pt Verdana", "#000");
		this.Trenched = false;
		this.Player = null;
		this.Attacking = null;
		this.Killed = null;
		this.Idle = false;
		this.Stunned = false;
		this.State = 0;
		this.Sprites = [];
		this.Rescued_Unit = null;
		this.X;
		this.Y;
		this.Alpha = new Info(255, this, function(index,info,input){
			info.data = input;
			game.Interface.Draw();
		}); // for STEALTH and building new unit
		var tileXOff = 0;
		var tileYOff = 0;
		this.X_Offset = function()
		{
			return CharData.X[this.State]+tileXOff;
		};
		this.Y_Offset = function()
		{
			return CharData.Y[this.State]+tileYOff;
		};
		this.Data = function()
		{	// returns a clone of the data
			var self = this;
			let data = {
				index:char_index,
				x:self.X,
				y:self.Y,
				health:self.Health
			};
			if(self.Cash!=null)
				data.cash = self.Cash;
			let extra_mods = [];
			for(let i=0;i<mods.length;i++)
			{
				if(!CharData.Modifiers.includes(mods[i]))
					extra_mods.push(mods[i].toStr());
			}
			if(extra_mods.length>0)
				data.mods = extra_mods;
			return data;
		};

		this.display_health = true;
		var showAttackWeakness = 0,
			showCounterStrength = 0;
		this.Active = false;
		this.Set_Active = function(value)
		{
			if(!CharData.Actable)return;
			this.Active = value;
			select_animation.set({show:value});
		};
		this.Draw = function(canvas, x, y, _scale)
		{
			var pic = this.Sprites[this.State];
			if(this.Idle)
			{
				pic = darken(pic);
			}
			if(this.Alpha.data!=255)
			{
				pic = opacity(pic, this.Alpha.data);
			}
			canvas.putImageData(_scale==null ? pic : scale(pic, _scale, _scale), x, y);
		};
		this.UI_Draw = function(canvas, x, y)
		{
			this.Draw(canvas,x+(TILESIZE/60*this.X_Offset()),y+(TILESIZE/60*this.Y_Offset()));
			if(this.Health<=0)return;
			if(this.Alpha.Get()==0)return;
			if(!this.display_health)return;
			canvas.save();
			canvas.translate(x,y);
			canvas.scale(TILESIZE/60,TILESIZE/60);
			if(this.Health!=this.Max_Health)
			{
				var percent = this.Health/this.Max_Health;
				Shape.Rectangle.Draw(canvas, 3, 54, 54, 5, "#000");
				var width;
				for(var i=0;i<4;i++)
				{
					width = Math.floor(13*(percent/.25-i));
					if(width>13)
					{
						width = 13;
					}
					Shape.Rectangle.Draw(canvas, 4+13*i, 55, width, 3, Team_Colors.Health_Display[i]);
					if(width<13)break;
				}
			}
			if(this.Active)
			{
				select_animation.set({
					show:true,
					x:x,
					y:y
				});
			}
			if(Additional_Display!=null)
			{
				Additional_Display(canvas, 0, 0, this);
			}
			if(this.Rescued_Unit!=null)
			{
				canvas.globalAlpha = .33;
				Shape.Rectangle.Draw(canvas, 2, 33, 30, 30, "#000");
				Shape.Rectangle.Draw(canvas, 3, 34, 30, 30, "#000");
				canvas.globalAlpha = 1;
				Shape.Rectangle.Draw(canvas, 0, 30, 30, 30, "#fff");
				this.Rescued_Unit.Draw(canvas, x+5, y+35, .5);
			}
			if(showAttackWeakness!=0)
			{
				canvas.save();
				canvas.globalAlpha = .9;
				if(showAttackWeakness==1)
				{	// weak attack
					Characters.BadAttack.Draw(canvas,0,0);
				}
				else if(showAttackWeakness==2)
				{	// okay attack
					Characters.OkayAttack.Draw(canvas,0,0);
				}
				else if(showAttackWeakness==3)
				{	// strong attack
					Characters.GreatAttack.Draw(canvas,0,0);
				}
				canvas.restore();
			}
			if(showCounterStrength!=0)
			{
				canvas.save();
				canvas.globalAlpha = .9;
				if(showCounterStrength==1)
				{	// okay attack
					Characters.WeakDanger.Draw(canvas,35,0);
				}
				else if(showCounterStrength==2)
				{	// okay attack
					Characters.Danger.Draw(canvas,35,0);
				}
				else if(showCounterStrength==3)
				{	// strong attack
					Characters.StrongDanger.Draw(canvas,35,0);
				}
				canvas.restore();
			}
			if(repair_ani.values.show)
			{
				repair_ani.set({
					show:true,
					x:x,
					y:y+40
				});
			}
			canvas.restore();
		};

		this.Display_Additional = function()
		{
			if(this.Radar())
			{
				Additional_Display = Char_Data.Radar_Display;
				return;
			}
		};
		this.Close_Additional = function()
		{
			Additional_Display = null;
			if(this.Resources())
				Additional_Display = Char_Data.Resources;
		};
		this.Display_Danger = function(defender)
		{
			if(this.Can_Attack(defender))
			{
				damage = this.Calculate_Damage(defender);
				percent_of_health = damage / defender.Health;
				if(percent_of_health>0.6)
				{
					showCounterStrength = 3;
				}
				else if(percent_of_health>0.3)
				{
					showCounterStrength = 2;
				}
				else showCounterStrength = 1;
			}
		};
		this.Update_Danger = function(x, y)
		{
			if(move_path==null)return;
			if(!move_path.Can_Move(x, y))return;
			var check_unit, _spaces;
			for(var i=game.Unit_Amount()-1;i>=0;i--)
			{
				check_unit = game.Get_Unit(i);
				if(!check_unit.Can_Attack(this))continue;
				check_unit.Close_Danger_Hints();
				if(check_unit.Slow_Attack)
				{
					if(check_unit.In_Range_From_Loc(check_unit.X, check_unit.Y, x, y))
						check_unit.Display_Danger(this);
					else check_unit.Close_Danger_Hints();
					continue;
				}
				check_unit.Close_Danger_Hints();
				_spaces = check_unit.Get_Movable_Spaces();
				for(var j=0;j<_spaces.length;j++)
				{
					if(check_unit.In_Range_From_Loc(_spaces[j][0], _spaces[j][1], x, y))
					{
						check_unit.Display_Danger(this);
						break;
					}
				}
			}
		};
		this.Display_Attack_Hints = function(source_unit)
		{
			var damage = source_unit.Calculate_Damage(this);
			var percent_of_health = damage / this.Health;
			if(percent_of_health>0.6)
			{
				showAttackWeakness = 3;
			}
			else if(percent_of_health>0.3)
			{
				showAttackWeakness = 2;
			}
			else showAttackWeakness = 1;
		};
		this.Close_Attack_Hints = function()
		{
			showAttackWeakness = 0;
		};
		this.Close_Danger_Hints = function()
		{
			showCounterStrength = 0;
		};

		this.Open_Selection = function()
		{
			if(move_path==null)return;
			this.Display_Additional();
			this.Update_Danger(this.X, this.Y);
			var unit_check;
			if(this.Alpha.data<255 || this.Unit_Type==1)
			{	// if cloaked or a flying unit
				// display enemy radars
				for(var i=game.Unit_Amount()-1;i>=0;i--)
				{
					unit_check = game.Get_Unit(i);
					if(unit_check.Player==this.Player)continue;
					if(unit_check.Radar())
						unit_check.Display_Additional();
				}
			}
			var _spaces = move_path.Attackables();
			for(var i=0;i<_spaces.length;i++)
			{
				unit_check = game.Units_Map.At(_spaces[i][0], _spaces[i][1]);
				if(unit_check==null)continue;
				if(this.Can_Attack(unit_check))
				{
					unit_check.Display_Attack_Hints(this);
				}
			}
		};
		this.Close_Selection = function()
		{
			this.Close_Additional();
			var unit_check;
			for(var i=game.Unit_Amount()-1;i>=0;i--)
			{
				unit_check = game.Get_Unit(i);
				unit_check.Close_Attack_Hints();
				unit_check.Close_Danger_Hints();
				unit_check.Close_Additional();
			}
		};
		this.Hide_Animation_Display = function()
		{
			select_animation.set({
				show:false
			});
			repair_ani.set({
				show:false
			});
		};

		this.Act = function(x, y, mover, whenFinished, scrollTo)
		{
			if(mover==null)
			{
				err("move not defined");
				if(whenFinished!=null)whenFinished(this);
				return false;
			}
			var end = [this.X,this.Y];
			for(var i=0;i<mover.length;i++)
			{
				if(mover[i]==0)
				{
					end[1]++;
				}
				else if(mover[i]==1)
				{
					end[1]--;
				}
				else if(mover[i]==2)
				{
					end[0]++;
				}
				else if(mover[i]==3)
				{
					end[0]--;
				}
			}
			if(scrollTo)game.Interface.Scroll_To_Tile(this.X, this.Y);

			var callback = function(__unit)
			{
				if(__unit.Alpha.data<255)
				if(game.Detected_By_Enemy(__unit))
				{
					Core.Fade_Drawable(__unit, 255, 15, function(__unit){
						__unit.End_Turn();
						game.Interface.Draw();

						if(whenFinished!=null)
							whenFinished(__unit);
					});
					return;
				}
				__unit.End_Turn();
				game.Interface.Draw();

				if(whenFinished!=null)
					whenFinished(__unit);
			};
			if(end[0]==x&&end[1]==y)
			{	/// when just moving
				if(this.X!=x || this.Y!=y)
					this.Move_To(mover,end,function(unit){
						if(unit.Stunned)
						{	// got interupted
							if(unit.Tracking())
							{
								unit.Stunned = false;
								unit.Attack(unit.Attacking,callback);
								return;
							}
						}
						if(callback!=null)callback(unit);
					});
				else callback(this);
				return true;
			}
			/// when attacking
		// this code has error when on server as sent move doesnt initialize path
		// only put this back in if bug appears where unit can attack wherever even when not in range
			if(!game.Terrain_Map.At(x,y).Hidden) // cannot attack a hidden tile
			var defender = game.Units_Map.At(x,y);
			if(defender!=null)
			if(defender.Alpha.data==255)
			if(this.Can_Attack(defender))
			{
				if(this.Slow_Attack)
				{
					if(this.In_Range(this.X,this.Y,defender))
					{
						this.Setup_Attack(defender, null, null, callback);
						return true;
					}
				}
				if(this.In_Range(end[0],end[1],defender))
				{
					var place = game.Units_Map.At(end[0],end[1]);
					if(place==null||place==this)
					{
						this.Setup_Attack(defender, mover, end, callback);
						return true;
					}
					else if(place.Alpha.Get()==0)
					{	// go, although it will be interupted by hidden enemy
						this.Setup_Attack(defender, mover, end, callback);
						return true;
					}
				}
			}
			if(whenFinished!=null)whenFinished(this);
			return false;
		};
		this.Start_Turn = function(client, callback)
		{
			if(client)
			{
				if(CharData.Actable)
				{
					this.Set_Active(true);
				}
			}
			else
			{
				if(CharData.Actable)
				{
					this.Active = true;
				}
			}
			this.Idle = false;
			this.Movement = CharData.Movement;


			var available = this.Mods_By_Type("Start Turn");
			var dead_weight = 0;
			for(var i=0;i<available.length;i++)
			{
				if(available[i].Do(this))
					dead_weight++;
			}

			this.Hurt(game.Terrain_Map.At(this.X, this.Y).Damage);

			setTimeout(function(){
				callback();
			}, dead_weight*10*fps);
		};
		this.End_Turn = function(act, stop_auto_check)
		{
			if(this.Idle)return;
			if(act==null)act = true;
			if(this.Active)
			{
				select_animation.set({
					show:false
				});
			}
			this.Set_Active(false);
			this.Attacking = null;
			var curCity = game.Cities_Map.At(this.X,this.Y);
			if(curCity!=null)curCity.Set_Active(false);
			this.Idle = true;
			if(act)
			{
				var available = this.Mods_By_Type("End Turn");
				for(var i=0;i<available.length;i++)
				{
					available[i].Do(this);
				}
			}
			if(!stop_auto_check)
			if(!~this.Player.Next_Active_Unit())
			if(!~this.Player.Next_Active_Building())
			{
				this.Player.End_Turn();
			}
		};

		this.On_Move = function(unit, mover){};
		function move_by_direction(unit, mover, done, i, dir)
		{
			if(dir==0)
			{
				var check_hidden = game.Units_Map.At(unit.X, unit.Y+1);
				if(check_hidden!=null)
				if(check_hidden.Alpha.data<255 || game.Terrain_Map.At(unit.X, unit.Y+1).Hidden)
				if(check_hidden.Player!=unit.Player)
				{
					tileXOff = 0;
					tileYOff = 0;
					unit.Stunned = true;
					unit.Attacking = check_hidden; // to show where the path was broken
					Core.Fade_Drawable(check_hidden, 255, 10, function(){
						done(unit);
					});
					return;
				}
				unit.Down(function(){
					unit.Y++;
					recur_animation(unit, mover, done, i+1);
				});
			}
			else if(dir==1)
			{
				var check_hidden = game.Units_Map.At(unit.X, unit.Y-1);
				if(check_hidden!=null)
				if(check_hidden.Alpha.data<255 || game.Terrain_Map.At(unit.X, unit.Y-1).Hidden)
				if(check_hidden.Player!=unit.Player)
				{
					tileXOff = 0;
					tileYOff = 0;
					unit.Stunned = true;
					unit.Attacking = check_hidden; // to show the path was broken
					Core.Fade_Drawable(check_hidden, 255, 10, function(){
						done(unit);
					});
					return;
				}
				unit.Up(function(){
					unit.Y--;
					recur_animation(unit, mover, done, i+1);
				});
			}
			else if(dir==2)
			{
				var check_hidden = game.Units_Map.At(unit.X+1, unit.Y);
				if(check_hidden!=null)
				if(check_hidden.Alpha.data<255 || game.Terrain_Map.At(unit.X+1, unit.Y).Hidden)
				if(check_hidden.Player!=unit.Player)
				{
					tileXOff = 0;
					tileYOff = 0;
					unit.Stunned = true;
					unit.Attacking = check_hidden; // to show where the path was broken
					Core.Fade_Drawable(check_hidden, 255, 10, function(){
						done(unit);
					});
					return;
				}
				unit.Right(function(){
					unit.X++;
					recur_animation(unit, mover, done, i+1);
				});
			}
			else if(dir==3)
			{
				var check_hidden = game.Units_Map.At(unit.X-1, unit.Y);
				if(check_hidden!=null)
				if(check_hidden.Alpha.data<255 || game.Terrain_Map.At(unit.X-1, unit.Y).Hidden)
				if(check_hidden.Player!=unit.Player)
				{
					tileXOff = 0;
					tileYOff = 0;
					unit.Stunned = true;
					unit.Attacking = check_hidden; // to show where the path was broken
					Core.Fade_Drawable(check_hidden, 255, 10, function(){
						done(unit);
					});
					return;
				}
				unit.Left(function(){
					unit.X--;
					recur_animation(unit, mover, done, i+1);
				});
			}
		}
		function recur_animation(unit, mover, done, i){
			if(unit.Alpha.data<255)
			{	/// check if radar can find
				if(game.Found_By_Radar(unit))
				{
					Core.Fade_Drawable(unit, 255, 10, function(){
						recur_animation(unit, mover, done, i);
					});
					return;
				}
			}
			if(unit.Radar())
			{
				var list = game.Radar_Search(unit);
				for(var j=0;j<list.length;j++)
				{
					Core.Fade_Drawable(list[j], 255, 10);
				}
			}

			var dir = mover[i];
			if(dir!=null)
			{
				move_by_direction(unit, mover, done, i, dir);
				return;
			}
					/// it's done moving -- at it's destination
			tileXOff = 0;
			tileYOff = 0;
			var check_hidden = game.Units_Map.At(unit.X+1, unit.Y);
			if(check_hidden!=null)
			if(check_hidden.Alpha.data<255)
			if(check_hidden.Player!=unit.Player)
			{
				Core.Fade_Drawable(check_hidden, 255, 7);
			}
			check_hidden = game.Units_Map.At(unit.X, unit.Y+1);
			if(check_hidden!=null)
			if(check_hidden.Alpha.data<255)
			if(check_hidden.Player!=unit.Player)
			{
				Core.Fade_Drawable(check_hidden, 255, 7);
			}
			check_hidden = game.Units_Map.At(unit.X-1, unit.Y);
			if(check_hidden!=null)
			if(check_hidden.Alpha.data<255)
			if(check_hidden.Player!=unit.Player)
			{
				Core.Fade_Drawable(check_hidden, 255, 7);
			}
			check_hidden = game.Units_Map.At(unit.X, unit.Y-1);
			if(check_hidden!=null)
			if(check_hidden.Alpha.data<255)
			if(check_hidden.Player!=unit.Player)
			{
				Core.Fade_Drawable(check_hidden, 255, 7);
			}
			done(unit);
		}
		function recur_slide(incFnc, frames, callback){
			if(frames<=0)
			{
				if(callback!=null)
					callback();
				return;
			}
			incFnc();
			game.Interface.Simple_Draw();
			setTimeout(function(){recur_slide(incFnc, frames-1, callback);},tpf);
		}
		this.Animate_Move = function(mover, done){
			this.display_health = false;
			recur_animation(this, mover, done, 0);
		};
		this.Face = function(x, y){
			x-=this.X;
			y-=this.Y;
			var hyp = Math.sqrt(x*x+y*y);
			var angle = Math.round(180/Math.PI*Math.acos(x/hyp));
			if(angle<=45&&angle>=-45)this.Face_Right();
			else if(angle>=135&&angle<=225)this.Face_Left();
			else
			{
				angle = Math.round(180/Math.PI*Math.asin(y/hyp));
				if(angle>45&&angle<135)
					this.Face_Down();
				else this.Face_Up();
			}
		};
		this.Face_Right = function(){
			this.State = 0;
		};
		this.Face_Up = function(){
			this.State = 1;
		};
		this.Face_Down = function(){
			this.State = 2;
		};
		this.Face_Left = function(){
			this.State = 3;
		};
		this.Up = function(callback){
			this.Face_Up();
			var amt = 10;
			recur_slide(function(){
				tileYOff-=amt;
			},6,callback);
		};
		this.Down = function(callback){
			this.Face_Down();
			var amt = 10;
			recur_slide(function(){
				tileYOff+=amt;
			},6,callback);
		};
		this.Left = function(callback){
			this.Face_Left();
			var amt = 10;
			recur_slide(function(){
				tileXOff-=amt;
			},6,callback);
		};
		this.Right = function(callback){
			this.Face_Right();
			var amt = 10;
			recur_slide(function(){
				tileXOff+=amt;
			},6,callback);
		};

		this.Move_From = function()
		{
			this.Terrain().Unit = null;
			var b = this.Terrain().Building;
			if(b==null)return;
			if(!b.Owner!=null)return;
			if(!b.Owner.Active)return;
			if(b.Idle)return;
			b.Set_Active(true);
		};
		this.Move_To = function(mover, end, callback)
		{		// go to this next
			moveSFX.Play();
			this.Move_From();
			if(!game.Interface.Fake)
			{
				game.Interface.Set_Moving_Unit(this);
				game.Interface.Simple_Draw();
			}
			this.On_Move(this, mover);
			this.display_health = false;
			var oldX = this.X;
			var oldY = this.Y;
			this.Animate_Move(mover,function(unit){
				moveSFX.Stop();
				setTimeout(function(){
					moveSFX.Stop();
				}, 2000);
				game.Units_Map.Set(oldX,oldY,null);
				game.Units_Map.Set(unit.X,unit.Y,unit);
				if(unit.Rescued_Unit!=null)
				{
					unit.Rescued_Unit.X = unit.X;
					unit.Rescued_Unit.Y = unit.Y;
				}
				if(!game.Interface.Fake)
					game.Interface.Set_Moving_Unit(null);
				unit.display_health = true;
				unit.Terrain().Unit = unit;
				var b = unit.Terrain().Building;
				if(b!=null)
				{
					b.Set_Active(false);
				}
				var available = unit.Terrain().Mods_By_Type("Properties");
				for(var i=0;i<available.length;i++)
				{
					available[i].Do(unit);
				}
				game.Player_Visibility(unit.Player);
				var hidden_enemy_check = game.Units_Map.At(unit.X+1, unit.Y);
				if(hidden_enemy_check!=null)
				if(hidden_enemy_check.Alpha.data<255)
				if(hidden_enemy_check.Player!=unit.Player)
					Core.Fade_Drawable(hidden_enemy_check, 255, 15);
				hidden_enemy_check = game.Units_Map.At(unit.X-1, unit.Y);
				if(hidden_enemy_check!=null)
				if(hidden_enemy_check.Alpha.data<255)
				if(hidden_enemy_check.Player!=unit.Player)
					Core.Fade_Drawable(hidden_enemy_check, 255, 15);
				hidden_enemy_check = game.Units_Map.At(unit.X, unit.Y+1);
				if(hidden_enemy_check!=null)
				if(hidden_enemy_check.Alpha.data<255)
				if(hidden_enemy_check.Player!=unit.Player)
					Core.Fade_Drawable(hidden_enemy_check, 255, 15);
				hidden_enemy_check = game.Units_Map.At(unit.X, unit.Y-1);
				if(hidden_enemy_check!=null)
				if(hidden_enemy_check.Alpha.data<255)
				if(hidden_enemy_check.Player!=unit.Player)
					Core.Fade_Drawable(hidden_enemy_check, 255, 15);
				if(callback!=null)
					callback(unit);
			});
		};
		this.Hurt = function(amt)
		{
			if(amt==0 || amt==null)return;
			if(repair_ani.values.show)
			{
				this.Del_Modifier(CURMODS.Start_Turn.Repair);
				repair_ani.set({show:false});
			}
			this.Health-=amt;
			if(this.Health<=0)
			{
				this.Die();
				return;
			}
			if(this.Health>this.Max_Health)
			{
				this.Health = this.Max_Health;
			}
			game.Interface.Draw();
		};
		this.Setup_Attack = function(target, mover, end, callback)
		{
			this.Attacking = target;
			var after_attack_response = function(unit){
				if(unit.Attacking==null)
				{	// got stopped and can't intercept
					if(callback!=null)
						callback(unit);
					return;
				}
				var available = unit.Mods_By_Type("Attack");
				for(var i=0;i<available.length;i++)
				{
					available[i].Do(unit);
				}
				unit.Attacking = null;
				game.Interface.Draw();
				if(target.In_Range(target.X,target.Y,unit)&&target.Can_Attack(unit))
				{
					setTimeout(function()
					{
						if(!target.Repairing() && !target.Dead)
						{
							target.Attack(unit,function()
							{
								setTimeout(function()
								{
									game.Interface.Draw();
									if(callback!=null)
										callback(unit);
								}, 500);
							});
						}
						else if(callback!=null)
							callback(unit);
					}, 850);
				}
				else
				{
					if(callback!=null)
						callback(unit);
				}
			};
			if(mover!=null)
			{
				this.Move_To(mover,end,function(unit){
					if(unit.Stunned)
					{	// got interupted
						if(unit.Tracking())
						{
							unit.Stunned = false;
							target = unit.Attacking;
							unit.Attack(target,after_attack_response);
						}
						else after_attack_response(unit);
						return;
					}
					unit.Attack(target,after_attack_response);
				});
				return;
			}
			if(this.Alpha.data<255)
			if(game.Detected_By_Enemy(this))
				this.Alpha.Set(255);
			this.Attack(target,after_attack_response);
		};
		this.Attack = function(defender, callback)
		{
			if(this.Stunned)
			{
				this.Stunned = false;
				if(callback!=null)callback(this);
				return;
			}
			var sneak_attack = false;
			if(this.Alpha.data<255)
			{
				sneak_attack = true;
				this.Alpha.Set(255);
			}
			if(attkSFX)attkSFX.Play(1000);
			this.Killed = null;
			this.Face(defender.X, defender.Y);
			var damage = this.Calculate_Damage(defender);
			if(defender.Repairing())damage*=1.20;
			damage*=(sneak_attack ? 2:1);
			this.Player.data.damage_delt+=damage;
			defender.Player.data.damage_received+=damage;
			defender.Hurt(damage);
			if(defender.Dead)
			{
				this.Player.data.units_killed++;
				this.Killed = defender;
			}
			if(callback!=null)
				callback(this);
		}
		this.In_Range = function(x, y, defender)
		{
			var dis = Math.abs(defender.X-x)+Math.abs(defender.Y-y);
			return (dis-this.Range[0]<this.Range[1]&&dis>=this.Range[0]);
		};
		this.In_Range_From_Loc = function(x, y, d_x, d_y)
		{
			var dis = Math.abs(d_x-x)+Math.abs(d_y-y);
			return (dis-this.Range[0]<this.Range[1]&&dis>=this.Range[0]);
		};
		this.Can_Attack = function(defender)
		{
			if(defender.Player==this.Player)return false;
			var available = this.Mods_By_Type("Can Attack");
			for(var i=0;i<available.length;i++)
			{
				var response = available[i].Do([this,defender]);
				if(response)return true;
				else if(response==null)continue;
				return false;
			}
			if(this.Slow_Attack)
			{
				return !defender.Trenched;
			}
			if(defender.Unit_Type==1)return false;
			if(this.Unit_Type==2)
			{
				return defender.Unit_Type==2;
			}
			if(defender.Unit_Type==2)
			{
				return this.Unit_Type!=0;
			}
			if(this.Source==3)return false;
			return true;
		};
		this.Repairing = function()
		{
			return repair_ani.values.show;
		};
		this.Repair = function()
		{
			if(this.Health==this.Max_Health)return;
			repair_ani.set({show:true});
			this.Add_Modifier(CURMODS.Start_Turn.Repair);
			game.Interface.Draw();
			this.End_Turn();
		};

		this.Calculate_Damage = function(defender)
		{
			var bonus = this.Health/this.Max_Health;
			if(this.Weapon==0)
			{
				if(defender.Armor==0)
				{
					bonus*=1.5;
				}else if(defender.Armor==1)
				{

				}else
				{
					bonus*=.5;
				}
			}
			else if(this.Weapon==1)
			{
				if(defender.Armor==0)
				{

				}else if(defender.Armor==1)
				{
					bonus*=1.15;
				}else
				{

				}
			}
			else
			{
				if(defender.Armor==0)
				{
					bonus*=.5;
				}else if(defender.Armor==1)
				{

				}else
				{
					bonus*=1.5;
				}
			}
			if(defender.Unit_Type==0)
			{
				var tile_def = defender.Terrain();
				if(tile_def.Building!=null)
					tile_def = tile_def.Building;
				bonus*=(1-tile_def.Protection);
				// bonus*=1+((this.Terrain().Height-tile_def.Height)/300);
			}
			var available = this.Mods_By_Type("Damage");
			for(var i=0;i<available.length;i++)
			{
				bonus*=available[i].Do([this, defender]);
			}
			bonus*=game.Active_Weather.Damage(this.Weapon);
			return Math.ceil(bonus*this.Power);
		};
		this.Calculate_Move_Cost = function(terrain)
		{
			// terrain types
			// 0 = dirty
			// 1 = rough
			// 2 = rugged
			// 3 = clean
			// 4 = hole-y
			// 5 = slippery
			// 6 = sea
			// 7 = impassable
			// 8 = connecting route

			// mover types
			// 0 = foot
			// 1 = wheel
			// 2 = tank
			// 3 = low air
			// 4 = med air
			// 5 = high air
			// 6 = surface water
			// 7 = submerged
			// 8 = heavy ship

			if(this.Unit_Type==1)
			if(game.Location_In_Radar(terrain.X, terrain.Y, this.Player))
				return 100; // if air is jammed
			if(this.Move_Type==9)
				return 100; //immoveable

			var t_data = Terrain_Data.TERRE[terrain.Source];

			if(t_data.Name=="Shore")
			{
				if(this.Move_Type==8)
					return 100;	// heavy boats
				if(this.Move_Type==7)
					return 2;	// wheel units
				if(this.Move_Type==1)
					return 2;	// submerged sea units
				return 1;
			}
			else if(t_data.Name=="Bridge")
			{
				if(this.Unit_Type==2)
					return 100;
			}

			var bonus = 1*game.Active_Weather.Move_Cost(this, terrain);
			//check modifiers path
			if(t_data.Type==7)return 100;
			if(t_data.Type==0)
			{
				if(this.Move_Type==1)bonus+=.5;
				if(this.Unit_Type==1)return 1*bonus;
				if(this.Unit_Type==2)return 100;
			}
			else if(t_data.Type==1)
			{
				if(this.Move_Type==0)bonus-=.5;
				if(this.Move_Type==1)bonus+=.5;
				if(this.Unit_Type==1)return 1*bonus;
				if(this.Unit_Type==2)return 100;
			}
			else if(t_data.Type==2)
			{
				if(this.Move_Type==1||this.Move_Type==2)return 100;
				if(this.Unit_Type==1)return 1*bonus;
				if(this.Unit_Type==2)return 100;
			}
			else if(t_data.Type==3)
			{
				if(this.Move_Type==1)bonus-=.75;
				if(this.Unit_Type==1)return 1*bonus;
				if(this.Unit_Type==2)return 100;
			}
			else if(t_data.Type==4)
			{
				if(this.Move_Type==0)bonus+=.5;
				if(this.Unit_Type==1)return 1*bonus;
				if(this.Unit_Type==2)return 100;
			}
			else if(t_data.Type==5)
			{
				if(this.Move_Type==0)bonus+=1;
				if(this.Move_Type==1)bonus+=1.5;
				if(this.Move_Type==2)bonus+=.5;
				if(this.Unit_Type==1)return 1*bonus;
				if(this.Unit_Type==2)return 100;
			}
			else if(t_data.Type==6)
			{
				if(this.Unit_Type==1)return 1*bonus;
				if(this.Unit_Type==0)return 100;
			}
			else if(t_data.Type==7)
			{
				return 100;
			}
			else if(t_data.Type==8)
			{
			}
			return Math.round(bonus*terrain.Drag);
		};

		this.Clone = function(engine)
		{
			return new Characters.Char_Class(engine,char_index);
		};

		this.Dead = false;
		this.Die = function()
		{
			this.Dead = true;
			this.Health = 0;
			this.Move_From();
			SFXs.Retrieve('explosion').Play();
			Core.Explode(this);
		};
		this.Remove_From_Game = function()
		{
			this.Player.Remove_Unit(this);
			game.Remove_Unit(this);
		};

		var move_path;
		this.Mover = null;
		this.Start_Path = function(x, y, onlyAllowedMoves)
		{
			if(x==null)
				x = this.X;
			if(y==null)
				y = this.Y;
			move_path = new Path_Finder_Handler(game, this, x, y, onlyAllowedMoves);
		};
		this.Current_Path = function()
		{
			return move_path;
		};
		this.Get_Movable_Spaces = function()
		{
			var __path = new Path_Finder_Handler(game, this, this.X, this.Y, true);
			return __path.All_Movable_Spaces();
		};

		this.Open_Actions = function(value)
		{
			if(game.Interface.Fake)return;

			if(!value)
			{
				game.Interface.Close_Menu();
				Menu.Game_Prompt.Erase();
				game.Interface.Select_Tile();
				return;
			}

			var self = this;

			var Mods = this.Mods_By_Type("Self Action");
			if(Mods.length==0)
			{
				game.Interface.Select_Tile();
				return;
			}
			var offset = Mods.length*15;
			var index = 1;
			var x = (self.X*TILESIZE)+30-game.Interface.X_Offset();
			var y = (self.Y*TILESIZE)+2-game.Interface.Y_Offset();

			x += (x<=offset+10) ? offset - 30 + (game.Interface.X_Offset()%TILESIZE) : 0;
			offset += (x>=game.Interface.Width()-10 - (offset*2)) ? offset + 32 - (game.Interface.X_Offset()%TILESIZE) : 0;

			with(Menu.Game_Prompt)
			{
				Erase();
				Add(new Canvas.Drawable(Shape.Rectangle, null, 0, 0, 600, 600, "#000", null, 0.05), function(){
					self.Open_Actions(false);
					game.Interface.Select_Tile();
				});

				for(var j in Mods)
				{
					Mods[j].Active = Mods[j].Test(self);
					Add(new Canvas.Drawable(Mods[j], null, x-offset, y, 30, 26, j), function(index)
					{
						self.Open_Actions(false);
						game.Interface.Select_Tile();
						Mods[index].Do(self);
					}, new Canvas.Drawable(Shape.Rectangle, null, x-offset, y, 30, 26, "#ff0", null, .5));
					offset-=30;
				}
			}

			INTERFACE.Display_Menu(Menu.Game_Prompt, true);
		};
		this.Mods_By_Type = function(type)
		{
			var cur = [];
			for(var i=0;i<mods.length;i++)
			{
				if(mods[i].Type==type)
					cur.push(mods[i]);
			}
			return cur;
		};
		this.Modifier_Amt = function()
		{
			return mods.length;
		}
		this.Modifier = function(i)
		{
			if(i<mods.length&&i>=0)
				return mods[i];
			err("Not a valid index");
			return null;
		}
		this.Add_Modifier = function(value)
		{
			mods.push(value);
		};
		this.Del_Modifier = function(value)
		{
			for(var i=0;i<mods.length;i++)
			{
				if(mods[i]==value)
				{
					mods.splice(i,1);
					return;
				}
			}
			err("Not a valid index");
		};

		if(this.Resources())
			Additional_Display = Char_Data.Resources;
	},
	New:function(Game, name)
	{	// used when you create unit from name
		var index = Char_Data.Get(name);
		if(index==0)
		{
			console.log(name+" is not a proper unit name.");
		}
		return new Characters.Char_Class(Game,index);
	}
};
