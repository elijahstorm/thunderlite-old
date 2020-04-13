var Characters = {
	BadAttack:Images.Retrieve("Bad Attack"),
	OkayAttack:Images.Retrieve("Okay Attack"),
	GreatAttack:Images.Retrieve("Great Attack"),
	WeakDanger:Images.Retrieve("Danger0"),
	Danger:Images.Retrieve("Danger1"),
	StrongDanger:Images.Retrieve("Danger2"),
	Char_Class:function(game, char_index)
	{
		let self = this;
		function err(txt)
		{
			console.error(name,self.Index,"->",txt);
		}
		self.SELECTABLE = 1;

		var CharData = Char_Data.CHARS[char_index];
		var name = CharData.Name;
		var attkSFX = CharData.AttackSFX;
		var moveSFX = CharData.MoveSFX;
		var repair_ani = Repair_Animation.New(animationCanvas, -TILESIZE, -TILESIZE, TILESIZE/3, TILESIZE/3, false);
		var select_animation = Select_Animation.New(animationCanvas, -TILESIZE, -TILESIZE, TILESIZE, TILESIZE, false);
		var mods = Core.Array.Clone(CharData.Modifiers);
		self.Description = function()
		{
			return CharData.Description;
		};
		self.Sprite = function()
		{
			return CharData.Sprite[0];
		};
		self.Index = null;

		self.Terrain = function()
		{
			return game.Terrain_Map.At(self.X, self.Y);
		};

		self.Game = game;
		self.Name = name;
		self.Source = char_index;
		self.Unit_Type = CharData.Type;
		self.Max_Health = CharData.Max_Health;
		self.Health = CharData.Max_Health;
		self.Armor = CharData.Armor;
		self.Power = CharData.Power;
		self.Weapon = CharData.Weapon;
		self.Movement = CharData.Movement;
		self.Radar = function(){
			return CharData.Modifiers.includes(CURMODS.Move.Radar);
		};
		self.Resources = function(){
			return CharData.Modifiers.includes(CURMODS.Self_Action.Miner);
		};
		if(CharData.Cash)
			self.Cash = CharData.Cash;
		self.Tracking = function(){
			return CharData.Modifiers.includes(CURMODS.Move.Tracking);
		};
		self.Move_Type = CharData.Move_Type;
		self.Slow_Attack = CharData.Slow; // can or can't move and attack on the same turn
		self.Range = Core.Array.Clone(CharData.Range);
		self.Sight = CharData.Sight;
		var Additional_Display = null;
		var WEAKNESSTEXT = new Text_Class("15pt Verdana", "#000");
		var STRENGTHTEXT = new Text_Class("15pt Verdana", "#000");
		self.Trenched = false;
		self.Player = null;
		self.Attacking = null;
		self.Killed = null;
		self.Idle = false;
		self.Stunned = false;
		self.State = 0;
		self.Sprites = [];
		self.Rescued_Unit = null;
		self.X;
		self.Y;
		self.Alpha = new Info(255, self, function(index,info,input){
			info.data = input;
			game.Interface.Simple_Draw();
		}); // for STEALTH and building new unit
		self.Fade = function(end, frames, callback)
		{
			game.Interface.Set_Unit_Focus(self);
			Core.Fade_Drawable(self, end, frames, function(){
				game.Interface.Set_Unit_Focus();
				if(callback!=null)
					callback();
			});
		};
		var tileXOff = 0;
		var tileYOff = 0;
		self.X_Offset = function()
		{
			return CharData.X[self.State]+tileXOff;
		};
		self.Y_Offset = function()
		{
			return CharData.Y[self.State]+tileYOff;
		};
		self.Data = function()
		{	// returns a clone of the data
			let data = {
				index:char_index,
				x:self.X,
				y:self.Y,
				health:self.Health
			};
			if(self.Rescued_Unit!=null)
				data.rescued = self.Rescued_Unit.Data();
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

		self.display_health = true;
		var showAttackWeakness = 0,
			showCounterStrength = 0;
		self.Active = false;
		self.Set_Active = function(value)
		{
			if(!CharData.Actable)return;
			self.Active = value;
		};
		self.Draw = function(canvas, x, y, _scale)
		{
			var pic = self.Sprites[self.State];
			if(self.Idle)
			{
				pic = darken(pic);
			}
			if(self.Alpha.data!=255)
			{
				pic = opacity(pic, self.Alpha.data);
			}
			if(game.FORCE_MERGE_DISPLAY)
			{
				pic = merge(canvas.getImageData(x, y, pic.width, pic.height), pic);
			}

			canvas.putImageData(_scale==null ? pic : scale(pic, _scale, _scale), x, y);
		};
		self.UI_Draw = function(canvas, x, y)
		{
			self.Draw(canvas,x+(TILESIZE/60*self.X_Offset()),y+(TILESIZE/60*self.Y_Offset()));
			if(self.Health<=0)return;
			if(self.Alpha.Get()==0)return;
			if(!self.display_health)return;
			canvas.save();
			canvas.translate(x,y);
			canvas.scale(TILESIZE/60,TILESIZE/60);
			if(self.Health!=self.Max_Health)
			{
				var percent = self.Health/self.Max_Health;
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
				if(self.Repairing())
				{
					repair_ani.set({
						show:true,
						x:x,
						y:y+(40*TILESIZE/60)
					});
				}
			}
			if(self.Active && self.Player==game.Client_Player())
			{
				select_animation.set({
					show:true,
					x:x,
					y:y
				});
			}
			if(Additional_Display!=null)
			{
				Additional_Display(canvas, 0, 0, self);
			}
			if(self.Rescued_Unit!=null)
			{
				canvas.globalAlpha = .33;
				Shape.Rectangle.Draw(canvas, 2, 33, 30, 30, "#000");
				Shape.Rectangle.Draw(canvas, 3, 34, 30, 30, "#000");
				canvas.globalAlpha = 1;
				Shape.Rectangle.Draw(canvas, 0, 30, 30, 30, "#fff");
				self.Rescued_Unit.Draw(hudCanvas, x+(10*TILESIZE/60), y+(36**TILESIZE/60), .5);
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
			canvas.restore();
		};

		self.Display_Additional = function()
		{
			if(self.Radar())
			{
				Additional_Display = Char_Data.Radar_Display;
				return;
			}
		};
		self.Close_Additional = function()
		{
			Additional_Display = null;
			if(self.Resources())
				Additional_Display = Char_Data.Resources;
		};
		self.Display_Danger = function(defender)
		{
			if(self.Can_Attack(defender))
			{
				damage = self.Calculate_Damage(defender);
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
		self.Update_Danger = function(x, y)
		{
			if(move_path==null)return;
			if(!move_path.Can_Move(x, y))return;
			var check_unit, _spaces;
			for(var i=game.Unit_Amount()-1;i>=0;i--)
			{
				check_unit = game.Get_Unit(i);
				if(!check_unit.Can_Attack(self))continue;
				check_unit.Close_Danger_Hints();
				if(check_unit.Slow_Attack)
				{
					if(check_unit.In_Range_From_Loc(check_unit.X, check_unit.Y, x, y))
						check_unit.Display_Danger(self);
					else check_unit.Close_Danger_Hints();
					continue;
				}
				check_unit.Close_Danger_Hints();
				_spaces = check_unit.Get_Movable_Spaces();
				for(var j=0;j<_spaces.length;j++)
				{
					if(check_unit.In_Range_From_Loc(_spaces[j][0], _spaces[j][1], x, y))
					{
						check_unit.Display_Danger(self);
						break;
					}
				}
			}
		};
		self.Display_Attack_Hints = function(source_unit)
		{
			var damage = source_unit.Calculate_Damage(self);
			var percent_of_health = damage / self.Health;
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
		self.Close_Attack_Hints = function()
		{
			showAttackWeakness = 0;
		};
		self.Close_Danger_Hints = function()
		{
			showCounterStrength = 0;
		};

		self.Open_Selection = function()
		{
			if(move_path==null)return;
			self.Display_Additional();
			self.Update_Danger(self.X, self.Y);
			var unit_check;
			if(self.Alpha.data<255 || self.Unit_Type==1)
			{	// if cloaked or a flying unit
				// display enemy radars
				for(var i=game.Unit_Amount()-1;i>=0;i--)
				{
					unit_check = game.Get_Unit(i);
					if(unit_check.Player==self.Player)continue;
					if(unit_check.Radar())
						unit_check.Display_Additional();
				}
			}
			var _spaces = move_path.Attackables();
			for(var i=0;i<_spaces.length;i++)
			{
				unit_check = game.Units_Map.At(_spaces[i][0], _spaces[i][1]);
				if(unit_check==null)continue;
				if(self.Can_Attack(unit_check))
				{
					unit_check.Display_Attack_Hints(self);
				}
			}
		};
		self.Close_Selection = function()
		{
			self.Close_Additional();
			var unit_check;
			for(var i=game.Unit_Amount()-1;i>=0;i--)
			{
				unit_check = game.Get_Unit(i);
				unit_check.Close_Attack_Hints();
				unit_check.Close_Danger_Hints();
				unit_check.Close_Additional();
			}
		};
		self.Hide_Animation_Display = function()
		{
			select_animation.set({
				show:false
			});
			repair_ani.set({
				show:false
			});
		};

		self.Act = function(x, y, mover, whenFinished, scrollTo)
		{
			if(mover==null)
			{
				err("move not defined");
				if(whenFinished!=null)whenFinished(self);
				return false;
			}
			var end = [self.X,self.Y];
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
			if(scrollTo)game.Interface.Scroll_To_Tile(self.X, self.Y);

			var callback = function(__unit)
			{
				if(__unit.Alpha.data<255)
				if(game.Detected_By_Enemy(__unit))
				{
					__unit.Fade(255, 15, function(__unit){
						try {
							__unit.End_Turn();
						} catch (e) {
							// unit is usually dead
						}
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
				if(self.X!=x || self.Y!=y)
					self.Move_To(mover,end,function(unit){
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
				else callback(self);
				return true;
			}
			/// when attacking
		// self code has error when on server as sent move doesnt initialize path
		// only put self back in if bug appears where unit can attack wherever even when not in range
			if(!game.Terrain_Map.At(x,y).Hidden) // cannot attack a hidden tile
			var defender = game.Units_Map.At(x,y);
			if(defender!=null)
			if(defender.Alpha.data==255)
			if(self.Can_Attack(defender))
			{
				if(self.Slow_Attack)
				{
					if(self.In_Range(self.X,self.Y,defender))
					{
						self.Setup_Attack(defender, null, null, callback);
						return true;
					}
				}
				if(self.In_Range(end[0],end[1],defender))
				{
					var place = game.Units_Map.At(end[0],end[1]);
					if(place==null||place==self)
					{
						self.Setup_Attack(defender, mover, end, callback);
						return true;
					}
					else if(place.Alpha.Get()==0)
					{	// go, although it will be interupted by hidden enemy
						self.Setup_Attack(defender, mover, end, callback);
						return true;
					}
				}
			}
			if(whenFinished!=null)whenFinished(self);
			return false;
		};
		self.Start_Turn = function(client, callback)
		{
			if(client)
			{
				if(CharData.Actable)
				{
					self.Set_Active(true);
				}
			}
			else
			{
				if(CharData.Actable)
				{
					self.Active = true;
				}
			}
			self.Idle = false;
			self.Movement = CharData.Movement;


			var available = self.Mods_By_Type("Start Turn");
			var dead_weight = 0;
			for(var i=0;i<available.length;i++)
			{
				if(available[i].Do(self))
					dead_weight++;
			}

			self.Hurt(game.Terrain_Map.At(self.X, self.Y).Damage);

			setTimeout(function(){
				callback();
			}, dead_weight*10*fps);
		};
		self.End_Turn = function(act, stop_auto_check)
		{
			if(self.Idle)return;
			if(act==null)act = true;
			moveSFX.Stop();
			self.Set_Active(false);
			self.Attacking = null;
			var curCity = game.Cities_Map.At(self.X,self.Y);
			if(curCity!=null)curCity.Set_Active(false);
			self.Idle = true;
			if(act)
			{
				var available = self.Mods_By_Type("End Turn");
				for(var i=0;i<available.length;i++)
				{
					available[i].Do(self);
				}
			}
			if(!stop_auto_check)
			if(!~self.Player.Next_Active_Unit())
			if(!~self.Player.Next_Active_Building())
			{
				self.Player.End_Turn();
			}
		};

		self.On_Move = function(unit, mover){};
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
					check_hidden.Fade(255, 10, function(){
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
					check_hidden.Fade(255, 10, function(){
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
					check_hidden.Fade(255, 10, function(){
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
					check_hidden.Fade(255, 10, function(){
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
					unit.Fade(255, 10, function(){
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
					list[j].Fade(255, 10);
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
				check_hidden.Fade(255, 7);
			}
			check_hidden = game.Units_Map.At(unit.X, unit.Y+1);
			if(check_hidden!=null)
			if(check_hidden.Alpha.data<255)
			if(check_hidden.Player!=unit.Player)
			{
				check_hidden.Fade(255, 7);
			}
			check_hidden = game.Units_Map.At(unit.X-1, unit.Y);
			if(check_hidden!=null)
			if(check_hidden.Alpha.data<255)
			if(check_hidden.Player!=unit.Player)
			{
				check_hidden.Fade(255, 7);
			}
			check_hidden = game.Units_Map.At(unit.X, unit.Y-1);
			if(check_hidden!=null)
			if(check_hidden.Alpha.data<255)
			if(check_hidden.Player!=unit.Player)
			{
				check_hidden.Fade(255, 7);
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
		self.Animate_Move = function(mover, done){
			self.display_health = false;
			try {
				moveSFX.Play();
			} catch (e) {
				console.error("trying to fix");
				setTimeout(function(){
					moveSFX.Play();
				}, 10);
			}
			recur_animation(self, mover, done, 0);
		};
		self.Face = function(x, y){
			x-=self.X;
			y-=self.Y;
			var hyp = Math.sqrt(x*x+y*y);
			var angle = Math.round(180/Math.PI*Math.acos(x/hyp));
			if(angle<=45&&angle>=-45)self.Face_Right();
			else if(angle>=135&&angle<=225)self.Face_Left();
			else
			{
				angle = Math.round(180/Math.PI*Math.asin(y/hyp));
				if(angle>45&&angle<135)
					self.Face_Down();
				else self.Face_Up();
			}
		};
		self.Face_Right = function(){
			self.State = 0;
		};
		self.Face_Up = function(){
			self.State = 1;
		};
		self.Face_Down = function(){
			self.State = 2;
		};
		self.Face_Left = function(){
			self.State = 3;
		};
		self.Up = function(callback){
			self.Face_Up();
			var amt = 10;
			recur_slide(function(){
				tileYOff-=amt;
			},6,callback);
		};
		self.Down = function(callback){
			self.Face_Down();
			var amt = 10;
			recur_slide(function(){
				tileYOff+=amt;
			},6,callback);
		};
		self.Left = function(callback){
			self.Face_Left();
			var amt = 10;
			recur_slide(function(){
				tileXOff-=amt;
			},6,callback);
		};
		self.Right = function(callback){
			self.Face_Right();
			var amt = 10;
			recur_slide(function(){
				tileXOff+=amt;
			},6,callback);
		};

		self.Move_From = function()
		{
			self.Terrain().Unit = null;
			var b = self.Terrain().Building;
			if(b==null)return;
			if(b.Owner==null)return;
			if(!b.Owner.Active)return;
			if(b.Idle)return;
			b.Set_Active(true);
		};
		self.Move_To = function(mover, end, callback)
		{		// go to self next
			self.Move_From();
			if(!game.Interface.Fake)
			{
				game.Interface.Set_Unit_Focus(self);
				game.Interface.Simple_Draw();
			}
			self.On_Move(self, mover);
			self.display_health = false;
			var oldX = self.X;
			var oldY = self.Y;
			self.Animate_Move(mover,function(unit){
				game.Units_Map.Set(oldX,oldY,null);
				game.Units_Map.Set(unit.X,unit.Y,unit);
				if(unit.Rescued_Unit!=null)
				{
					unit.Rescued_Unit.X = unit.X;
					unit.Rescued_Unit.Y = unit.Y;
				}
				if(!game.Interface.Fake)
					game.Interface.Set_Unit_Focus(null);
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
					hidden_enemy_check.Fade(255, 15);
				hidden_enemy_check = game.Units_Map.At(unit.X-1, unit.Y);
				if(hidden_enemy_check!=null)
				if(hidden_enemy_check.Alpha.data<255)
				if(hidden_enemy_check.Player!=unit.Player)
					hidden_enemy_check.Fade(255, 15);
				hidden_enemy_check = game.Units_Map.At(unit.X, unit.Y+1);
				if(hidden_enemy_check!=null)
				if(hidden_enemy_check.Alpha.data<255)
				if(hidden_enemy_check.Player!=unit.Player)
					hidden_enemy_check.Fade(255, 15);
				hidden_enemy_check = game.Units_Map.At(unit.X, unit.Y-1);
				if(hidden_enemy_check!=null)
				if(hidden_enemy_check.Alpha.data<255)
				if(hidden_enemy_check.Player!=unit.Player)
					hidden_enemy_check.Fade(255, 15);
				if(callback!=null)
					callback(unit);
			});
		};
		self.Hurt = function(amt)
		{
			if(amt==0 || amt==null)return;
			if(self.Repairing())
			{
				self.Del_Modifier(CURMODS.Start_Turn.Repair);
			}
			self.Health-=amt;
			if(self.Health<=0)
			{
				self.Die();
				return;
			}
			if(self.Health>self.Max_Health)
			{
				self.Health = self.Max_Health;
			}
			game.Interface.Draw();
		};
		self.Setup_Attack = function(target, mover, end, callback)
		{
			self.Attacking = target;
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
			if(mover.length!=0)
			{
				self.Move_To(mover,end,function(unit){
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
			if(self.Alpha.data<255)
			if(game.Detected_By_Enemy(self))
				self.Alpha.Set(255);
			self.Attack(target,after_attack_response);
		};
		self.Attack = function(defender, callback)
		{
			if(self.Stunned)
			{
				self.Stunned = false;
				if(callback!=null)callback(self);
				return;
			}
			var sneak_attack = false;
			if(self.Alpha.data<255)
			{
				sneak_attack = true;
				self.Alpha.Set(255);
			}
			if(attkSFX)
			{
				try {
					attkSFX.Play(Math.floor(Math.random()*4));
				} catch (e) {
					console.error("trying to fix");
					setTimeout(function(){
						attkSFX.Play(Math.floor(Math.random()*4));
					}, 20);
				}
			}
			self.Killed = null;
			self.Face(defender.X, defender.Y);
			var damage = self.Calculate_Damage(defender);
			if(defender.Repairing())damage*=1.20;
			damage*=(sneak_attack ? 2:1);
			self.Player.data.damage_delt+=damage;
			defender.Player.data.damage_received+=damage;
			defender.Hurt(damage);
			if(defender.Dead)
			{
				self.Player.data.units_killed++;
				self.Killed = defender;
			}
			if(callback!=null)
				callback(self);
		}
		self.In_Range = function(x, y, defender)
		{
			var dis = Math.abs(defender.X-x)+Math.abs(defender.Y-y);
			return (dis-self.Range[0]<self.Range[1]&&dis>=self.Range[0]);
		};
		self.In_Range_From_Loc = function(x, y, d_x, d_y)
		{
			var dis = Math.abs(d_x-x)+Math.abs(d_y-y);
			return (dis-self.Range[0]<self.Range[1]&&dis>=self.Range[0]);
		};
		self.Can_Attack = function(defender)
		{
			if(defender.Player==self.Player)return false;
			var available = self.Mods_By_Type("Can Attack");
			for(var i=0;i<available.length;i++)
			{
				var response = available[i].Do([self,defender]);
				if(response)return true;
				else if(response==null)continue;
				return false;
			}
			if(self.Slow_Attack)
			{
				return !defender.Trenched;
			}
			if(defender.Unit_Type==1)return false;
			if(self.Unit_Type==2)
			{
				return defender.Unit_Type==2;
			}
			if(defender.Unit_Type==2)
			{
				return self.Unit_Type!=0;
			}
			if(self.Source==3)return false;
			return true;
		};
		self.Repairing = function()
		{
			return mods.includes(CURMODS.Start_Turn.Repair);
		};
		self.Repair = function()
		{
			if(self.Health==self.Max_Health)return;
			self.Add_Modifier(CURMODS.Start_Turn.Repair);
			game.Interface.Draw();
			self.End_Turn();
		};

		self.Calculate_Damage = function(defender)
		{
			var bonus = self.Health/self.Max_Health;
			if(self.Weapon==0)
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
			else if(self.Weapon==1)
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
				// bonus*=1+((self.Terrain().Height-tile_def.Height)/300);
			}
			var available = self.Mods_By_Type("Damage");
			for(var i=0;i<available.length;i++)
			{
				bonus*=available[i].Do([self, defender]);
			}
			bonus*=game.Active_Weather.Damage(self.Weapon);
			return Math.ceil(bonus*self.Power);
		};
		self.Calculate_Move_Cost = function(terrain)
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

			if(self.Unit_Type==1)
			if(game.Location_In_Radar(terrain.X, terrain.Y, self.Player))
				return 100; // if air is jammed
			if(self.Move_Type==9)
				return 100; //immoveable

			var t_data = Terrain_Data.TERRE[terrain.Source];

			if(t_data.Name=="Shore")
			{
				if(self.Move_Type==8)
					return 100;	// heavy boats
				if(self.Move_Type==7)
					return 2;	// wheel units
				if(self.Move_Type==1)
					return 2;	// submerged sea units
				return 1;
			}
			else if(t_data.Name=="Bridge")
			{
				if(self.Unit_Type==2)
					return 100;
			}

			var bonus = 1*game.Active_Weather.Move_Cost(self, terrain);
			//check modifiers path
			if(t_data.Type==7)return 100;
			if(t_data.Type==0)
			{
				if(self.Move_Type==1)bonus+=.5;
				if(self.Unit_Type==1)return 1*bonus;
				if(self.Unit_Type==2)return 100;
			}
			else if(t_data.Type==1)
			{
				if(self.Move_Type==0)bonus-=.5;
				if(self.Move_Type==1)bonus+=.5;
				if(self.Unit_Type==1)return 1*bonus;
				if(self.Unit_Type==2)return 100;
			}
			else if(t_data.Type==2)
			{
				if(self.Move_Type==1||self.Move_Type==2)return 100;
				if(self.Unit_Type==1)return 1*bonus;
				if(self.Unit_Type==2)return 100;
			}
			else if(t_data.Type==3)
			{
				if(self.Move_Type==1)bonus-=.25;
				if(self.Unit_Type==1)return 1*bonus;
				if(self.Unit_Type==2)return 100;
			}
			else if(t_data.Type==4)
			{
				if(self.Move_Type==0)bonus+=.5;
				if(self.Unit_Type==1)return 1*bonus;
				if(self.Unit_Type==2)return 100;
			}
			else if(t_data.Type==5)
			{
				if(self.Move_Type==0)bonus+=1;
				if(self.Move_Type==1)bonus+=1.5;
				if(self.Move_Type==2)bonus+=.5;
				if(self.Unit_Type==1)return 1*bonus;
				if(self.Unit_Type==2)return 100;
			}
			else if(t_data.Type==6)
			{
				if(self.Unit_Type==1)return 1*bonus;
				if(self.Unit_Type==0)return 100;
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

		self.Clone = function(engine)
		{
			return new Characters.Char_Class(engine,char_index);
		};

		self.Dead = false;
		self.Die = function()
		{
			self.Dead = true;
			self.Health = 0;
			self.Move_From();
			Core.Explode(self, function(){
				if(self.Game.Game_Over)return;
				let acts = self.Mods_By_Type("Death");
				for(let i in acts)
				{
					acts[i].Do(self);
				}
			});
		};
		self.Remove_From_Game = function()
		{
			self.Player.Remove_Unit(self);
			game.Remove_Unit(self);
		};

		var move_path;
		self.Mover = null;
		self.Start_Path = function(x, y, onlyAllowedMoves)
		{
			if(x==null)
				x = self.X;
			if(y==null)
				y = self.Y;
			move_path = new Path_Finder_Handler(game, self, x, y, onlyAllowedMoves);
		};
		self.Current_Path = function()
		{
			return move_path;
		};
		self.Get_Movable_Spaces = function()
		{
			var __path = new Path_Finder_Handler(game, self, self.X, self.Y, true);
			return __path.All_Movable_Spaces();
		};

		self.Open_Actions = function(value)
		{
			if(game.Interface.Fake)return;

			if(!value)
			{
				game.Interface.Close_Menu();
				Menu.Game_Prompt.Erase();
				game.Interface.Select_Tile();
				return;
			}

			var Mods = self.Mods_By_Type("Self Action");
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
		self.Mods_By_Type = function(type)
		{
			var cur = [];
			for(var i=0;i<mods.length;i++)
			{
				if(mods[i].Type==type)
					cur.push(mods[i]);
			}
			return cur;
		};
		self.Modifier_Amt = function()
		{
			return mods.length;
		}
		self.Modifier = function(i)
		{
			if(i<mods.length&&i>=0)
				return mods[i];
			err("Not a valid index");
			return null;
		}
		self.Add_Modifier = function(value)
		{
			mods.push(value);
		};
		self.Del_Modifier = function(value)
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

		if(self.Resources())
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
