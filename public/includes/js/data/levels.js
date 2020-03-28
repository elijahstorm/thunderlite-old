var Levels_Class = function()
{
	let Script_Reader = function(Game, _srpt_input)
	{	// parses script data into functionable commands
		if(_srpt_input=="" || _srpt_input==undefined)
		{
			this.Do = function(){};
			return;
		}
		let Event = function(__type, __script, __attribute)
		{	// list of commands with a single event call
			let actions = new Array();
			this.Type = __type;
			this.Attribute = __attribute;

			let lastIndex = 0,
				enterBreak = __script.indexOf("\n"),
				command, action, action_point, affect, affectStr, attribute;

			while(enterBreak!=-1)
			{
				command = __script.substring(lastIndex, enterBreak);

				action_point = command.indexOf(":");

				if(action_point!=-1)
				{
					action = command.substring(0, action_point);
					affectStr = command.substring(action_point+1, command.length);

					if(action.indexOf(" ")!=-1)
					{
						attribute = action.substring(action.indexOf(" ")+1, action.length);
						action = action.substring(0, action.indexOf(" "));
					}else attribute = "";

					affect = affectStr.split(",");
					let badCode = false;

					for(let __iter=0;__iter<affect.length;__iter++)
					{
						let isQuote = affect[__iter].indexOf("\"");
						if(isQuote!=-1)
						{
							if(affect[__iter].indexOf("\"", isQuote+1)==-1)
							{
								if(__iter==affect.length-1)
								{
									affect[__iter] = affect[__iter].substring(isQuote+1, affect[__iter].length);
									continue;
								}
								let xtra_commas = 1;
								for(;__iter+xtra_commas<affect.length;xtra_commas++)
								{
									if(affect[__iter+xtra_commas].indexOf("\"")!=-1)
									{
										break;
									}
								}
								if(__iter+xtra_commas==affect.length)
								{	// no closing quotation marks
									badCode = true;
									break;
								}
								let _span = 1;
								for(;_span<=xtra_commas;_span++)
								{
									affect[__iter] += ","+affect[__iter+_span];
								}
								affect.splice(__iter+1, xtra_commas);
								__iter--;
								continue;
							}
							affect[__iter] = affect[__iter].substring(isQuote+1, affect[__iter].indexOf("\"", isQuote+1));
						}else affect[__iter] = parseInt(affect[__iter]);
					}

					if(badCode)continue;
						// bad line, so will refuse to run this whole line

					actions.push([action, affect, attribute]);
				}

				lastIndex = enterBreak+1;
				enterBreak = __script.indexOf("\n", lastIndex);
			}

			let self = this;
			self.Do_Event = function(i)
			{
				if(i==null)
				{
					i = 0;
				}
				else if(i>=actions.length)
				{
					return;
				}



				if(actions[i][0]=="talk")
				{
					if(actions[i][2].charAt(0)=="#")
					{
						let Number = actions[i][2].substring(1, actions[i][2].length);
						if(Number!=NaN)
						{
							let Player = Game.Player(Number-1);
							if(Player!=null)
								actions[i][2] = Player.Name;
						}
					}
					for(let __iter=0;__iter<actions[i][1].length;__iter++)
						Dialog.Write(actions[i][2], actions[i][1][__iter]);
					Dialog.On_Finish(function(){
						self.Do_Event(i+1);
					});
					return;
				}
				else if(actions[i][0]=="wait")
				{
					if(actions[i][1]==NaN)return;
					let overlay_btn = INTERFACE.Clickable.Add_Button(INTERFACE.Clickable.Overlay,function(){
						return false;
					},"Dialog_Stop_Wait");
					setTimeout(function(){
						INTERFACE.Clickable.Delete_Button(overlay_btn);
						self.Do_Event(i+1);
					}, actions[i][1]*1000);
					return;
				}
				else if(actions[i][0]=="move")
				{
					Game.Interface.Scroll_To_Tile(actions[i][1][0], actions[i][1][1]);
					setTimeout(function(){
						self.Do_Event(i+1);
					}, 800);
					return;
				}

				else if(actions[i][0]=="set")
				{
					if(actions[i][2].substring(0, 7)=="player ")
					{
						let Number = parseInt(actions[i][2].substring(7, actions[i][2].length));
						if(Number!=NaN)
						{
							let Player = Game.Player(Number-1);
							if(Player!=null)
								Player.Name = actions[i][1];
						}
					}
				}

				else if(actions[i][0]=="hl")
				{
					Core.Point(Game, actions[i][1][0], actions[i][1][1]);
				}
				else if(actions[i][0]=="unhl")
				{
					Core.Unpoint(Game, actions[i][1][0], actions[i][1][1]);
				}
				else if(actions[i][0]=="terrain")
				{
					var Map = Game.Terrain_Map;
					var index = Terrain_Data.Get(actions[i][1][0]);
					var x = actions[i][1][1], y = actions[i][1][2];
					var new_ter = new Terrain.Terre_Class(Game, index, "Terrain("+x+","+y+")", x, y,
						Terrain_Data.Connnection_Decision(index, Game.map_source_data, x, y));

					Map.Set(x, y, new_ter);
				}

				else if(actions[i][0]=="hurt")
				{
					if(actions[i][2]=="unit")
					{
						let troop = Game.Units_Map.At(actions[i][1][0], actions[i][1][1]);
						if(troop!=null)
							troop.Hurt(actions[i][1][2]);
					}
					else if(actions[i][2]=="city")
					{
						let city = Game.Cities_Map.At(actions[i][1][0], actions[i][1][1]);
						if(city!=null)
						if(city.Stature.Percent()<1)
						{
							city.Raid(actions[i][1][2]);
						}
					}
				}
				else if(actions[i][0]=="add")
				{
					if(actions[i][2]=="unit")
					{
						let troop = Game.Units_Map.At(actions[i][1][0], actions[i][1][1]);
						if(troop==null)
						{
							troop = Characters.New(Game,actions[i][1][1]);
							SFXs.Retrieve("build").Play();
							troop.Alpha.data = 0;
							troop.Set_Active(Game.Active_Player().Team==actions[i][1][0]-1);
							troop.Idle = false;
							Game.Add_Unit(troop, actions[i][1][2], actions[i][1][3], actions[i][1][0]-1);
							Game.Interface.Set_Unit_Focus(troop);
							Core.Fade_Drawable(troop, 255, 7, function(){
								Game.Interface.Set_Unit_Focus();
								troop.Alpha.data = 255;
								Game.Interface.Draw();
								self.Do_Event(i+1);
							});
							return;
						}
					}
					else if(actions[i][2]=="city")
					{
						let city = Game.Cities_Map.At(actions[i][1][0], actions[i][1][1]);
						if(cities!=null)
							city.Die();
						city = Buildings.New(Game,actions[i][1][1]);
						SFXs.Retrieve("build").Play();
						city.Alpha.data = 0;
						city.Set_Active(Game.Active_Player().Team==actions[i][1][0]-1);
						Game.Add_Building(city, actions[i][1][2], actions[i][1][3], actions[i][1][0]-1);
						Game.Interface.Set_Unit_Focus(city);
						Core.Fade_Drawable(city, 255, 7, function(){
							Game.Interface.Set_Unit_Focus();
							city.Alpha.data = 255;
							Game.Interface.Draw();
							self.Do_Event(i+1);
						});
						return;
					}
				}
				else if(actions[i][0]=="kill")
				{
					if(actions[i][2]=="unit")
					{
						let troop = Game.Units_Map.At(actions[i][1][0], actions[i][1][1]);
						if(troop!=null)
							troop.Die();
					}
					else if(actions[i][2]=="city")
					{
						let city = Game.Cities_Map.At(actions[i][1][0], actions[i][1][1]);
						if(city!=null)
							city.Die();
					}
				}

				Game.Interface.Draw();
				self.Do_Event(i+1);
			};
		};
		let Commands = new Array();

		this.Do = function(_type, attribute)
		{
			for(let _i=0;_i<Commands.length;_i++)
			{
				if(_type==Commands[_i].Type)
				if(""==Commands[_i].Attribute || attribute==Commands[_i].Attribute)
				{
					Commands[_i].Do_Event(0);
				}
			}
		};

		let parseStartTag = _srpt_input.indexOf("<"),
			parseEndTag = 0,
			endCode = 0,
			att_check = 0,
			attribute,
			tag, code;

		while(parseStartTag!=-1)
		{
			parseEndTag = _srpt_input.indexOf(">", parseStartTag);
			if(parseEndTag==-1)break;

			tag = _srpt_input.substring(parseStartTag+1, parseEndTag);

			att_check = tag.indexOf(" ");
			if(att_check!=-1)
			{
				attribute = tag.substring(att_check+1, tag.length);
				tag = tag.substring(0, att_check);
			}
			else attribute = "";

			endCode = _srpt_input.indexOf("</"+tag, parseEndTag);
			if(endCode==-1)break;

			code = _srpt_input.substring(parseEndTag+1, endCode);

			Commands.push(new Event(tag, code, attribute));

			parseStartTag = _srpt_input.indexOf("<", endCode+3+tag.length);
		}
	};
	this.Blank_Script = new Script_Reader();


	// socket.emit('userdata add','progress');
	let unlocked_levels = 1;
	let LevelData = {
		Name:["Intro", "Choke Points", "Stealth", "Resource Planning", "End Of The World"],
		Map:[
				//** CAMPAIGN 1 **//
			[
				"fctfjgvmz Rz¥mcdmcdmclelclclclelflflclclclelelclclcldlglglglglglclclglglglglglglflclclglglclclclclclelflflelclelglclflclcclclflflflflclclglclflflflflflcdlcdlchlchlclglclclelclflflclcdlcdlcdlcdlglelclelclelcclflglglchlcdlcilcdlclclelelflclgldlchlcdlglcdlclclcblflflglglglcdlchlglchlelclflclglglcdlglcdlglglclclelflclglclcdlglglglelclmlt§lmc^k^b^clc^cc^d^clc^cc^k^clc^cc^cc^clc^j^cb^clc^c^d^blc^d^e^blc^b^e^blc^d^b^blc^b^c^bli^c^c^blf^c^f^blg^i^h^bli^j^g^blc^e^k^blc^d^cc^blc^f^cc^bld^cb^cb^cld^cb^e^clf^cc^i^clh^j^i^clmc^b^b^blc^i^d^clmbbb_hlbc_hlbd_hlbe_hlcf_hlcg_hlmn¥¦¤¦p<<§¤¦R§ ¦lRj^i^Rdb<¦R~ lRT¢RST<¡¨lRj^j<¦Ry  ¡ lRTzST^RT{R¡¢R«¡§Y¤R¤«R¦¡R¡¥`T<R§ ¦lRd^RTs  ¦¡¤R T^Rj^h<©¦lRc<R§ ¦lRj^g<©¦lRc<R§ ¦lRi^h<©¦lRc<¡¨lRcd^Rcd<©¦lRc<R§ ¦lRd^RT¡¤¢¡ R T^Rk^i<R§ ¦lRd^RT¡¤¢¡ R T^Rj^j<R§ ¦lRd^RT¡¤¢¡ R T^Rcb^g<R§ ¦lRd^RT¡¤¢¡ R T^Rcc^f<©¦lRc<¦R~ lRTST<¦Ry  ¡ lRTsST<<©¦lRc<¦R¡¤¤lRT~ SR{YR¤R¦¡R¢ST<¦R~ lRT¡R¤R«¡§qT<¦R¡¤¤lRT{YR¨R¦R¦¡Rª¢ R¦¤R©R¦R¡§¦R¡R¦¥R¥¦§¦¡ `T<lRj^h<¦R¡¤¤lRTx¤¥¦R¡RR¦¦RR¦ R¦¦R§¥¦R¥¦¤¡«R«¡§¤R¦¤¡¡¢¥R¥RR¦Rs  ¦¡¤R `T<¦R¡¤¤lRTv¡ Y¦R¦¤«R¦¡R¦RR¡ R©¦R¦R¦¤¡¡¢¥R«¡§R¨R¦R R¦¥R¦¦^R¦R¥Rz¨«Rv ¥R R ¥R¦¡RR¦ R¡ R«RRz¨«Rs¦¦¤`T<§ lRj^h<<¡¨lRb^Rb<lRb^c<lRc^d<lRd^e<lRb^e<lRd^b<¦R¡¤¤lRT¡§¤R  ¦¤«R¦¤¡¡¢¥R¦¦R©¦R~¦Rs¦¦^R©R¥R¥§¢¤R ¦¨`T<§ lRb^c<§ lRc^d<§ lRd^e<§ lRb^e<§ lRd^b<lRc^c<lRc^f<¦R¡¤¤lRT¡§¤R¦ R R¡¤¦¤R¦¦R©¦R§Rs¦¦^R©R¥R §¦¤^R§¦R¦¡¥R¦©¡R ¡¦R ¡§R¦¡RR`T<§ lRc^c<§ lRc^f<<<¡¨lRi^Rd<lRi^d<¦R¡¤¤lRTR¥¦R¢ R¡R¦¡ R¤R©¡§RR¦¡R¦¤¦R¦¤Ru¢¦`R{R«¡§R¢¦§¤R¦¤Ru¢¦^R¦R ¥R¡¤¥R©R¢¦R¡¢¦«R R¦«R©R¨R§¢`T<¦R¡¤¤lRT¡§R R¢¦§¤R «R§ ¥R«R¦¤¦ R«¡§¤R  ¦¤«R¦¤¡¡¢¥R¡¨¤R¦`T<¡¨lRb^Rb<lRd^e<¦R¡¤¤lRT R¦¥R  ¦¤«R¦¤¡¡¢R¡¨¤R¦¤^R R¤ ¡¤RR©¦R«¡§¤R¡¦¤R¦¤¡¡¢¥`T<¦R¡¤¤lRT{ R¦¥R¦¤¤ ^R«¡§¤R¦¤¡¡¢¥R©RR R«R¦R¡§ ¦ ¥^R§¥R¦ ¥R R¦¤§¥R  ¡¦R¤¨R¡¨¤R¡§ ¦ ¥`T<§ lRi^d<§ lRd^e<<¦R¡¤¤lRT¦Y¥RR¡¤R ¡©`Ry¡¡R§`T<<na¥¦¤¦p<<n© p<¦Ry  ¡ lRTs¤¤¤ST<¦R¡¤¤lRT¥SR{R ©R«¡§R¡§R¡R¦`R§^R¦Y¥R¡¨R R{YRª¢ R¨¤«¦ `T<na© p<<n¡¥p<¦R¡¤¤lRTz¤Y¥RR¦¦R¦¢lR~¦Rs¦¦¥R¤R¥§¢¤R¦¨R¦¡R~¦Rs¤¡¤^Rz¨«Rs¦¦¥R¤R¨¤«R ¦¨R ¥¦R~¦Rs¤¡¤`R§Rs¦¦¥R¤R §¦¤`T<¦R¡¤¤lRTuRR¤¡¡¢R¦¡R¥R ¡R¡§¦R¦Y¥R¦^R¦¦R¢¡©¤^R¦¦R¦«¢^R R¤¡¤R¦«¢`T<¦R¡¤¤lRT¤«R SR¡§R©¤R§¥¦R¥¡R¡¥R¦¥R¦`T<na¡¥p<<<n¦§¤ Rfp<<¦R¡¤¤lRT¡§Y¤R¡ R©`R}¢R¦R§¢ST<<na¦§¤ p<m",


				"h {s}jm¡ ¡R¡¤mcdmcdmclclclclclclclclglclclelclclglglglglglglglclelflglglglcdlcdlcdlcdlcdlclclclcdlcdlcilcdlchlflflflchlcdlcdlcdlcdlclclclflflflflflflcdlcglcdldlcldlclflflfljlflflcdlcdlclelclclclflflflflflflchlclclcblklclclclclflflflflelclclclclclcblclclflflflclelclclclclclclclclflflelcblclclclclclcclclclclflcblclklclclclclclclclclflmlt§lmd^b^b^bld^c^f^blc^b^e^blc^c^j^blg^c^h^blf^b^j^blh^b^k^blce^i^i^clce^j^j^clce^i^h^clce^i^g^clce^k^k^clce^cb^cb^clce^cc^cb^clce^j^f^clce^cb^f^clce^cc^f^clce^k^f^clcd^cb^i^clcc^k^b^clcc^h^c^clcc^j^d^cld^h^e^cld^cc^c^cld^cb^b^cld^b^d^bld^c^cb^blcc^cb^e^clf^g^b^clc^i^b^clc^cb^d^clc^cc^e^clme^cc^k^cld^cb^j^clmbmn¥¦¤¦p<<¦R~ lRT¡©R¦ R«¡§SST^RTR§```T<¦R¡¤¤lRTY¤R ¡¦R¡§¦R¡R¦R©¡¡¥R«¦ST<¦Ry  ¡ lRT{R¨R©«R¦¡¡R «R§ ¦¥R¡¢¤R¦¡R«¡§^R R¤¥¡§¤¥R¨¥¦SR¥R¥RR¤¦R ^R R{R¨R¦R¦¦¤R¤¡§ `T<<lRcb^Ri<©¦lRc<¦R¡¤¤lRT~ R¦¥R¥¥RR¦¤¡§SRy  ¡ R¥R¡¤R¤¥¡§¤¥R R¡¤R¦¤¡¡¢¥R¥R©`Rs R¦¦R¤R R¥RRR¤ `R{¦R R§R¤ ¡¤ ¦¥R§¥ R¤¡§¤¥¥R¦R¡¦¥R¤¡R¦R¤¡§ `T<§ lRcb^Ri<<lRi^Rd<lRi^Re<lRj^Rh<lRcb^Rc<lRcc^Rb<lRcc^Rd<<©¦lRf<<§ lRi^Rd<§ lRi^Re<§ lRj^Rh<§ lRcb^Rc<§ lRcc^Rb<§ lRcc^Rd<<<¦R¡¤¤lRTR¨R¦¡R§¥R¦¨R¥¦¤¦«R¦¡R¨¡R« R¤`R~¦Y¥R¨R¡§¤R¦¤¡¡¢¥R§RR¦¤ R¡ R¦R¡¥¦R¥¡R¦¦R©R R§ ¤R¡© R R¤¦RR ¥¨R¢¡¥¦¡ `T<<¡¨lRb^bR<©¦lRc<¦¤¤ lRTu «¡ T^Rd^Rb<©¦lRc<¦¤¤ lRTu «¡ T^Rd^Rc<©¦lRc<¦¤¤ lRTu «¡ T^Rd^Rd<©¦lRc<<¦R¡¤¤lRTu «¡ ¥R¢¤¡¨R¡¡R ¥R¦¡R«¡§¤R¦¤¡¡¢¥R R¡ ^R R¥¡R¥¦¡¢R¡ R¤ R©¢¡ ¤«R¤¡R R¦¨R ¥¦R«¡§¤R¦¤¡¡¢¥R R¦R¦¤ ¥`T<¦R¡¤¤lRTt¤¥R R¡¥R¢¤¡¨R¨¤«R¦¦R ¥^R¥¡R¡ ¥¤R¦¥R©R«¡§R §¨¤R«¡§¤R¦¤¡¡¢¥`R¥R¦¥R¦¡R«¡§¤R¨ ¦R¦R¦¥R¡R¢¡ ¦`T<¦R¡¤¤lRTu¡R¦R «R¢¡¥¦¡ R¡§¦^R R¡ Y¦R¦R¦R¨ R¡ R«¡§SR¡§¤Rz¨«Ru¡ ¡¥R¤R£§¢¢R¦¡RR©¦Rz¨«Rs¤¡¤R¦ ¥RR¦¡¥R¢¥«Rs  ¦¡¤Y¥R¦¦R¨R§¥R¦¤¡§R¡¤`T<¦R¡¤¤lRTtR¤§^R¦¥R©¡ Y¦RR¥«R¥R¦R «R¤ R R¥¦R§`R¦«R¨R©R«¡§R R R¡ Y¦R¡¥R¦R¢¨¡¦R¢¡¥¦¡ SRy¡¡R§R¤^R{YR¡ R¦¡R¡RR¡¤R¤ ¡¤ ¦¥`T<¦R¡¤¤lRT{YRRR¥¡¡ ^RR¥§¤R¦¡R¢R¦R¤R¡©R¦R¤¡¥R¤R¥¡R©R¨R¥¢R¦¡R¤ R R¦R¤ ¡¤ ¦¥`T<<na¥¦¤¦p<<n¦§¤ Rep<<R§ ¦lRc^RT¦¦R T^Rb^j<¦R¡¤¤lRTz«SR{YR`Rs R©¦RR¢¤¥ ¦R«¡§Y¤R¡  R¡¨SR¥RR¡«¥R¤R¦¦R ¥`T<¦R¡¤¤lRTs¦¤R¦«R¡¨^R¦«R©R¦§¤ R ¨¥R¦¡R¦R «RR¦¤R¥R ¡R «R¦¤¡¡¢R ¤R¦`R¥R ¥R¦«R RR§¥R¦¡R¡R ¡ R¦¦¥^RR¦R «R¤§ ¥R ¦¡R¦SR¥R§ ¦R©R R¦R¦¦RR¤`Rv¡R ¡¦R¡¥R¦ST<¦R¡¤¤lRTs R¤¤^R¦Y¥R¡¦¡ R©R¡R¡¢¤¡¥RR¦R¦¦¥R R «R¦¤¡¡¢`R¡§YR¨R¦¡R¡¨R¦R R¦¡RR¦`Rz¡©¨¤RR¥§¤¢¤¥R¦¦R©RRdªR^R§¦R¦«R¤R ¡¦R¦R¡¥¦R¢¡©¤§R R¥¡R¡ Y¦R¦¡¥¥R¦R¥¦¤¦R ¦¡R¦¦`T<¦R¡¤¤lRT¡§Y¤R¡ R¡¡^R§¦R¢R¡ R¡§¦`R{YRRR RR¦¦R¦R¡¤R©¦R¡¤R¤ ¡¤ ¦¥`T<<na¦§¤ p<<n¦§¤ Rhp<<R§ ¦lRc^RT¦¦R T^Rb^j<R§ ¦lRc^RTs  ¦¡¤R T^Rc^j<R§ ¦lRc^RT¡¦R¤§T^Rb^k<R§ ¦lRc^RTxR T^Rb^cb<¦R¡¤¤lRT¡©SR¡§Y¤R¡ R¥¡R©R©¦¡§¦R`Ry¡¡R¡¤R«¡§SSRz¤Y¥R¡¤R¦¤¡¡¢¥`R{YRRR¥¡¡ R ST<<<na¦§¤ p<<n¦§¤ Rjp<<R§ ¦lRc^RT¦¦R T^Rb^j<R§ ¦lRc^RTs  ¦¡¤R T^Rc^j<R§ ¦lRc^RT¡¦R¤§T^Rb^k<R§ ¦lRc^RT¡¤¢¡ R T^Rb^cb<R§ ¦lRc^RT¡¤¢¡ R T^Rc^k<¦R¡¤¤lRT¥R¥R¦`R¥R¥RR{R¡§R¤ `R¥R¦RRR¦¡§R¦¦R¥¦R¦¡R¡`T<©¦lRc<¦R¡¤¤lRTt§¦R{R¨R¦R R«¡§`T<<na¦§¤ p<m",


				"d¥ikxcm¤¤«R¦R¦R  ¥§mcimccmcdlchlchlclclcdlclclclclglchlclclclglglglglglglglchlclclglglclclglglglclchlclclglclclclglclclclchlclclglclclclglclclclchlclclglcldlclglcldldlcdlchlclglclclclglcldlclcdlchlclglclclcdlcilcdlclflcdlcdlchlcilcdlcdlcdlcilcdlclflcdlcdlchlcilcdlcdlcdlcilchlclflcdlchlclglclchlcdlcilcdlflflchlclclglclclclglclflflclclglglcldlclgldlflflclglglclclclglglclflflglglclclclclglclclflflclclclclclglglcldlfljlclclclclglglclclflflflmlt§lmd^h^f^bld^h^g^bld^h^h^bld^cd^f^cld^ce^f^cld^ce^g^cld^cf^i^clc^g^f^blc^g^g^blc^g^h^blg^f^g^blj^g^e^blj^d^e^blj^d^i^blj^f^i^bli^d^h^blh^d^k^blcc^cf^c^clcc^cf^h^cle^cd^g^cle^i^g^blcb^c^g^bli^c^f^blcg^ch^d^clcg^ch^i^clcg^ch^h^clj^cg^b^clj^ch^c^clj^ch^b^clj^ce^b^clj^cg^d^clj^ch^e^clh^e^e^blmmbbb_glbc_glbd_glce_glcf_glmn¥¦¤¦p<<¦R¡¤¤lRTR¨R¦¡R¢R¡ SR¤R¥R R§ §¥R¥¦¤¦R¥¦¤¡ ¡R§¢RST^RT{R©R R£§«R¦R§¢R¦¤R©R R¢¦§¤R¥¡R¡R¦R§ §¥R¤¥¡§¤¥R R§¥R¦R¦¡R¥§¤¨¨R¡¤R¦R§ ¦R¦R¨R¤«R¤¤¨¥R R¢¥R§¥R¦§¤ R¦R¦¦R¦© R§¥R Ry  ¡ `T<<lRc^Rg<¦R¡¤¤lRTz¤R¥RR¤«R¥¦¤¦R§ ¦R¡¤R¡¦¦ R¢¡¥¦¡ ¥^RR©R§¥R¥¦R¦`T^RT{¦R©R¥¦R¦¤¡§R¦R «R«¡§R¦¦^R RR©¦¨¤R¥R¤¦«R R¦R¥R©`T<lRf^Rg<¦R¡¤¤lRT¥R¦¥R¦¡R«¡§¤R¨ ¦R¡ R©¦R¦R¡¦R¤§R¦¡RR¦¦R«R¦¦`T<§ lRc^Rg<§ lRf^Rg<¦R¡¤¤lRTR «R¥¡R¥RR©R¦¦R ¥R¥R©R¦¥R¦`T<<lRi^Rg<<¦R¡¤¤lRT¥R¥RRR|¤R¤§`T^RT{¦R©R¦¦R «Rz R¨¥R R¦R¥§¤¤¡§  R¤`T^RT{¦R Y¦R¦¦^R§¦R¦Y¥R¥¦RR§¥§R¢R¡R ¤«`T<<§ lRi^Rg<<¦R¡¤¤lRT{¦R¡¡¥RR¦Y¥R¡ R¦¡R¤ R¥¡¡ ``R¥R¥¡©¥R¡© R¦¤¡¡¢¥R R¤§¥R¦¦¥`T<¦R¡¤¤lRT¥^R¥¦«R¥R¡§¦R¦¤``T<<na¥¦¤¦p<m",



				"w¦vdt{m¤Rv¡© mckmcimcdlcdlcdlcdlcdlchlchlclclflclclclclglclclcdlcglcdlcelchlclclclclflclclclclglclclcdlcglcdlchlclclflflclclclclclclglclclcdlcdlcdlchlclflclflflclclflclclglglglcdlcdlchlclflflflclclflclclclclglclclcdlchlclflflilflflclclelclclclglclclcdlchlclflcljlilclelelclclelglglclclcdlchlclclflflflflflelelelelglelclclcdlchlclflflclililflclelelelglelclelcdlchlclflflflilfldlclclclelglclelclcdlchlflclelcleldlflfldlclglglelelclchlflclclelelflcldlflclclglelcleldlclflclelclelelclclclclclglclcldlflclclclclelcleleldlclclglglcldldlflclclclclelglglglglglglglclcldlflflclclclglglglelclelelclclcldldlflflglglglglclelelclcleleleldlflflflflclclglclclclclelelelcleldlflflflflclclglclclclclelclelcldlflflflflflmlt§lmc^j^cd^blc^h^cd^blc^f^cd^blcb^c^cd^blcb^d^cd^blh^e^cd^blg^ch^d^clg^ch^b^clcc^cj^d^clcc^ch^c^clj^ci^d^clj^cg^c^cld^i^ce^bld^h^ce^bld^e^cf^bld^j^cg^blc^g^cf^blc^i^cf^blc^h^cg^blc^i^ch^blc^e^ce^blc^f^ce^blg^e^ch^blg^c^cf^bli^b^cf^bli^b^cg^bli^c^cg^bli^d^cf^blmi^cj^c^cli^ci^b^clg^ci^c^clj^cj^b^cld^cg^d^clg^cc^i^_clg^k^k^_cle^cb^cc^_cld^cc^cc^_clj^k^cc^_clj^cd^cc^_clj^ce^k^_clj^ci^cb^_clj^cg^cc^_clj^cd^ce^_clj^cc^cf^_clj^k^cf^_clmbmn¥¦¤¦p<<¦R¡¤¤lRTz¤R¦R¥SRR§ §¥R¥¦¤¡ ¡SSR R¡¡ ¥¥R©R©¤R£§R ¡§`RR R¦¡R¢¦§¤R¦¥R¡¤Ry  ¡ R¡¥ST^RTR¥¡§R¨RR ^R§¥R«¡§¤R  ¦¤«R¦¤¡¡¢¥R¦¡R¢¦§¤R¦R«R¡¦¡ ¥`T<<¡¨lRch^cg<lRk^Rcc<lRk^Rcf<lRcc^Rcf<lRcd^Rce<lRcd^Rcc<lRce^Rk<lRcg^Rcc<lRci^Rcb<<©¦lRd<¦R¡¤¤lRT¥R¡R§ ¥R¢¤¡¨R ¡R¡¤R«¡§R¦¡R§¥R§¤ R¦¦`T<<§ lRk^Rcc<§ lRk^Rcf<§ lRcc^Rcf<§ lRcd^Rce<§ lRcd^Rcc<§ lRce^Rk<§ lRcg^Rcc<§ lRci^Rcb<<<lRk^Rk<lRcc^Ri<<©¦lRd<¦R¡¤¤lRT¥R¥¢¡¦¥R©RR©¤R«¡§R R§Rª¦¤R¦¤¡¡¢¥R¦¡R¢R¦¥R¦`T<<§ lRk^Rk<§ lRcc^Ri<<<lRcb^Rcc<lRcc^Rcc<<©¦lRd<¦R¡¤¤lRTz¡©¨¤^R¡R¡ R¥ Y¦R ¡§R¦¡R  R¦¤¡¡¢¥`R¥R¡¦¡ ¥R¡¤R ¦R R¢¤¦R¥§¢¢«R¤£§¤R¦¡R§Ry¤¡§ R¦¤¡¡¢¥R¡¤Rs¤R¦¤¡¡¢¥`T^RTwR§ R¥R¤£§¤R¡¤R¦¤R¤¥¢¦¨R¦¡RR§¦`T<<§ lRcb^Rcc<§ lRcc^Rcc<<<na¥¦¤¦p<<<n¦§¤ Rdp<<¦R¡¤¤lRTsSRR ¡ST<<¡¨lRg^Rb<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rf^Rh<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rg^Re<R§ ¦lRd^RT¦¤Ru¡ ¡T^Ri^Rf<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rj^Re<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rcd^Re<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rcf^Rh<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rce^Rc<©¦lRc<<¡¨lRcj^Rcf<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rch^Rch<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rci^Rcf<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rcj^Rcg<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rcj^Rce<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rcj^Rcc<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rci^Rj<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rcj^Rh<©¦lRc<<¡¨lRj^Rb<R§ ¦lRd^RT¢¤R T^Rk^Rd<R§ ¦lRd^RT¢¤R T^Rcc^Rd<©¦lRc<<<¦R¡¤¤lRTR ¡SR«R§¥R§¥SRR©¤ Y¦R£§R ¡§`T<<¦R~ lRT¦R¤R©R¡ R¦¡R¡qT<<¦R¡¤¤lRTR¨R¦¡R¢¤¥¥R¡ ^RR©R¡RR ¡©R¦«YR§¥¦R¡¡©R§¥R R R§¥RR¦R¦R  ¥§`R§¤R¡¤¥R¤R¦¡¡R© R¦R¦R¡ ¦`T<¦R¡¤¤lRT§¤R¡ «R¡¢R¥R¦¡R£§«R¢¦§¤R¦R¥¦¤¡ ¡R¤R¡¤R¦¤R  ¦¤«R¦¤¡¡¢¥R¢¦§¤R¦`T<<©¦lR`g<¦R¡¤¤lRT¡§Y¨R¢§R¤¥R¡¤R¦¥R¢¥¦R©R©¥`R}¢R¦R§¢^R¡§¤R R¥R¡¥¦R R¥¦ST<<<na¦§¤ p<m",


				"i}ukgm¦ ¡R¡¤¥mcjmcfmcglcdlchlchlclclfljlilclclglclclcdlchlclflflflclilflclelglclclcdlchlclclclclflflflglclglclclcdlcdlchlclcldlflelglglglglglglcdlcdlchlflflfldlflhlhlclglclclcdlcdlchlclclclfldlflhlhlglelclcdlcdlcdlchlchlhlflflflhlhlglclelcdlcglcdlcdlchlhlflflhlflhlglclclcdlcdlcglcdlcdlchlchlflhlhlhlglclelcdlcdlcdlcdlcdlcdlchlclfldlhlglclclchlchlchlchlclchlhlfldldlhlglclclclclclclclelflhlhlclflglglclglglglhlflflflflflclflclglglclclglflflhlhlhlhldldlelclglclklglglglglglglhlfldlclelglglglglclclglhlglhlflclclclglglclglklclglhlglglglglglglglglclglclklglhlhlhlclflclclglmlt§lmcd^d^k^blcd^ce^d^clcd^cg^d^clg^cg^c^cle^cg^h^cld^ce^g^cld^cg^g^cld^ch^g^cld^ci^g^cld^ci^f^cld^ce^e^cld^cf^e^clcc^cf^f^clcc^ch^d^clcc^cf^d^cli^ci^b^cli^cd^b^cli^cd^c^clc^f^k^blc^g^k^blc^h^k^blc^i^cb^blc^e^h^blc^f^i^blc^i^j^blc^j^j^blc^k^cb^blf^f^cc^blg^h^cc^blh^e^cb^bli^e^ce^bli^c^cc^blcb^d^cc^bld^j^cc^bld^j^cb^blmd^c^cd^bli^ch^c^clc^ci^c^cli^ce^c^cli^ce^b^cld^cf^b^cld^ci^e^cle^cg^e^clf^cc^b^clf^cc^c^clf^cc^d^cle^ch^f^clg^cg^f^clg^cc^f^clh^cb^c^clcb^j^b^clcb^g^b^clcb^k^e^cle^d^cd^blg^f^cb^blg^d^cb^blg^f^cd^bli^b^cb^bli^c^k^bli^d^ce^bli^f^ce^blj^cd^k^_clj^cc^k^_clj^k^i^_clj^d^g^_clj^e^f^_clj^cf^cc^_clj^k^ce^_clj^i^ce^_cli^cc^e^clc^b^cd^bli^ci^k^_cli^cg^cb^_cli^ci^i^_cli^ce^i^_clmbmn¥¦¤¦p<<¦R¡¤¤lRT¥R¥¡§RR¡§¤R R¥¦ ¡`RR R¦¡R¥§¤¨¨R¦¥R¦¦`T<¦R¡¤¤lRTR¨R ¦¤ R¦R¤R R¥§¤R¥¡R¢¡¤¦ ¦R§ ¥R R¦¥R¡¤R ¥`T<<©¦lR`g<<¦R¡¤¤lRT ¡¤¦§ ¦«R¦R¡¡¥RRy  ¡ RR¦R¥``R¦¥R¥R ¡¦R¡ R¦¡RR R¥«R¦`T<¦R¡¤¤lRTR «R¤R¥¥R¦¡R¨R¡¤¦RR¥¦¤¡ R ¥R©¦R¦¥R¡¦¦ ¥R§¢R`Rs R¦R¥¥R¦¤R¨R¦¥R¨R¡R¤«`RtR¤R¡R¢¡¦¥¡¦¥R¡ R¤¡R¦R¥¥`T<¦R¡¤¤lRT```y¡¡R§R R¥¦«R¥¦¤¡ `T<<na¥¦¤¦p<m"
			]


				//** CAMPAIGN 2 **//
			,[
				"euf¬cªgjm{mckmchmcdlcdlcdlcdlcdlcdlcdlcdlcflcdlcflcdlcdlcdlcdlcdlchlclclclclcdlcdlcdlcdlcdlcdlcglcdlcdlclcdlcdlclclclclclcdlclclclcdlcdlchlflclcdlcdlflclclclclcjlclelcjlcjlclclclclcdlcdlchldldldlclchlcdlclcdlcdlflclclclchlcdlclclclclchlcflcdlcjlcdlchlflflclflcdlcdlcjlcjlchlcdlcdlcdlcdlcjlclclelclclcdlcdlchlclclcdlcelcdlcdlclelclclclclchlcdlcglcdlcjlcjlcdlcelcdlclclclelclelclchlcdlcdlcdlclclchlcdlclelclclclelelchlcdlcelcglchlcdlclclchlclclelclelclcdlcdlcelcdlcdlclcdlchlclclclelelclclcdlchlcdlcdlcelcdlclchlcdlelclclclclelclclclclclchlcdlelclchlclclclclclelclelclclclclcdlclchlcdlclclclclelclelclchlcdlclclcdlclcdlcdlclelclclelelclcdlcdlcglcdlclcdlchlcdlchlclelclclelelelclcdlchlcdlcdlcdlclcjlclclclelelelclclclclclcdlcelcglcdlcdlclclclclclclclclclclchlcdlcelcdlmlt§ly¤ l¡©lmck^d^b^blc^d^g^blc^e^f^blc^f^cd^clc^h^ce^clc^f^cf^clc^cd^f^dlc^cf^e^dlc^ce^cd^elc^cd^cc^elc^cd^ce^elc^cf^cf^elc^c^cf^clc^c^e^blc^ce^f^dlc^cg^e^dlck^cj^c^dlck^cg^cg^elck^b^cf^clc^d^c^blmc^d^d^blg^f^ce^clc^ce^g^dlg^ce^cc^elh^h^g^blh^j^ce^clh^cb^f^dlg^d^e^blg^cf^f^dlc^ce^ce^elh^cc^cc^elc^e^cf^cli^cg^k^_cli^d^i^_clf^c^c^bld^c^d^ble^f^g^blk^cj^c^dlk^cg^cg^elk^d^b^ble^h^cd^cld^e^ce^clf^e^cc^clf^cc^g^dle^cf^h^dld^cd^i^dlf^cf^cb^ele^cd^cb^eld^cd^cd^eli^j^k^_cli^j^c^_clj^i^d^_clj^f^j^_clj^h^k^_clj^cc^k^_clj^i^i^_clcb^h^f^_clcb^g^i^_clj^ci^cc^_clj^cj^g^_clj^k^cb^_clj^k^i^_clk^b^cf^clcb^cb^cd^_clcb^ci^ce^_clcb^cb^c^_clcb^b^h^_clcb^cb^cf^_clcb^j^e^_clmcbb_klcc_klcd_klbe_klcf_klcg_klbh_kldi_kldj_klmn¥¦¤¦p<<¥¦R¢«¤RclRTt¤¦ TRRR<¥¦R¢«¤RdlRT¢ TRRR<¥¦R¢«¤RelRTy¤ «TRRR<¥¦R¢«¤RflRT{¦«TRRR<<¦RUclRT{R¨R¦R¡¤¦R¥¦`T<¦RUdlRT{R¨R¦R¡§¦R¥¦`T<¦RUelRT{R¨R¦R¡¤¦Rw¥¦`T<¦RUflRT{R¨R¦R¡§¦Rw¥¦`T<RRRR<na¥¦¤¦p<RRRRm",


				"h {s}jm¡ ¡R¡¤mcdmcdmclclclclclclclclglclclelclclglglglglglglglclelflglglglcdlcdlcdlcdlcdlclclclcdlcdlcilcdlchlflflflchlcdlcdlcdlcdlclclclflflflflflflcdlcglcdldlcldlclflflfljlflflcdlcdlclelclclclflflflflflflchlclclcblklclclclclflflflflelclclclclclcblclclflflflclelclclclclclclclclflflelcblclclclclclcclclclclflcblclklclclclclclclclclflmlt§lmd^b^b^bld^c^f^blc^b^e^blc^c^j^blg^c^h^blf^b^j^blh^b^k^blce^i^i^clce^j^j^clce^i^h^clce^i^g^clce^k^k^clce^cb^cb^clce^cc^cb^clce^j^f^clce^cb^f^clce^cc^f^clce^k^f^clcd^cb^i^clcc^k^b^clcc^h^c^clcc^j^d^cld^h^e^cld^cc^c^cld^cb^b^cld^b^d^bld^c^cb^blcc^cb^e^clf^g^b^clc^i^b^clc^cb^d^clc^cc^e^clme^cc^k^cld^cb^j^clmbmn¥¦¤¦p<<¦R~ lRT¡©R¦ R«¡§SST^RTR§```T<¦R¡¤¤lRTY¤R ¡¦R¡§¦R¡R¦R©¡¡¥R«¦ST<¦Ry  ¡ lRT{R¨R©«R¦¡¡R «R§ ¦¥R¡¢¤R¦¡R«¡§^R R¤¥¡§¤¥R¨¥¦SR¥R¥RR¤¦R ^R R{R¨R¦R¦¦¤R¤¡§ `T<<lRcb^Ri<©¦lRc<¦R¡¤¤lRT~ R¦¥R¥¥RR¦¤¡§SRy  ¡ R¥R¡¤R¤¥¡§¤¥R R¡¤R¦¤¡¡¢¥R¥R©`Rs R¦¦R¤R R¥RRR¤ `R{¦R R§R¤ ¡¤ ¦¥R§¥ R¤¡§¤¥¥R¦R¡¦¥R¤¡R¦R¤¡§ `T<§ lRcb^Ri<<lRi^Rd<lRi^Re<lRj^Rh<lRcb^Rc<lRcc^Rb<lRcc^Rd<<©¦lRf<<§ lRi^Rd<§ lRi^Re<§ lRj^Rh<§ lRcb^Rc<§ lRcc^Rb<§ lRcc^Rd<<<¦R¡¤¤lRTR¨R¦¡R§¥R¦¨R¥¦¤¦«R¦¡R¨¡R« R¤`R~¦Y¥R¨R¡§¤R¦¤¡¡¢¥R§RR¦¤ R¡ R¦R¡¥¦R¥¡R¦¦R©R R§ ¤R¡© R R¤¦RR ¥¨R¢¡¥¦¡ `T<<¡¨lRb^bR<©¦lRc<¦¤¤ lRTu «¡ T^Rd^Rb<©¦lRc<¦¤¤ lRTu «¡ T^Rd^Rc<©¦lRc<¦¤¤ lRTu «¡ T^Rd^Rd<©¦lRc<<¦R¡¤¤lRTu «¡ ¥R¢¤¡¨R¡¡R ¥R¦¡R«¡§¤R¦¤¡¡¢¥R R¡ ^R R¥¡R¥¦¡¢R¡ R¤ R©¢¡ ¤«R¤¡R R¦¨R ¥¦R«¡§¤R¦¤¡¡¢¥R R¦R¦¤ ¥`T<¦R¡¤¤lRTt¤¥R R¡¥R¢¤¡¨R¨¤«R¦¦R ¥^R¥¡R¡ ¥¤R¦¥R©R«¡§R §¨¤R«¡§¤R¦¤¡¡¢¥`R¥R¦¥R¦¡R«¡§¤R¨ ¦R¦R¦¥R¡R¢¡ ¦`T<¦R¡¤¤lRTu¡R¦R «R¢¡¥¦¡ R¡§¦^R R¡ Y¦R¦R¦R¨ R¡ R«¡§SR¡§¤Rz¨«Ru¡ ¡¥R¤R£§¢¢R¦¡RR©¦Rz¨«Rs¤¡¤R¦ ¥RR¦¡¥R¢¥«Rs  ¦¡¤Y¥R¦¦R¨R§¥R¦¤¡§R¡¤`T<¦R¡¤¤lRTtR¤§^R¦¥R©¡ Y¦RR¥«R¥R¦R «R¤ R R¥¦R§`R¦«R¨R©R«¡§R R R¡ Y¦R¡¥R¦R¢¨¡¦R¢¡¥¦¡ SRy¡¡R§R¤^R{YR¡ R¦¡R¡RR¡¤R¤ ¡¤ ¦¥`T<¦R¡¤¤lRT{YRRR¥¡¡ ^RR¥§¤R¦¡R¢R¦R¤R¡©R¦R¤¡¥R¤R¥¡R©R¨R¥¢R¦¡R¤ R R¦R¤ ¡¤ ¦¥`T<<na¥¦¤¦p<<n¦§¤ Rep<<R§ ¦lRc^RT¦¦R T^Rb^j<¦R¡¤¤lRTz«SR{YR`Rs R©¦RR¢¤¥ ¦R«¡§Y¤R¡  R¡¨SR¥RR¡«¥R¤R¦¦R ¥`T<¦R¡¤¤lRTs¦¤R¦«R¡¨^R¦«R©R¦§¤ R ¨¥R¦¡R¦R «RR¦¤R¥R ¡R «R¦¤¡¡¢R ¤R¦`R¥R ¥R¦«R RR§¥R¦¡R¡R ¡ R¦¦¥^RR¦R «R¤§ ¥R ¦¡R¦SR¥R§ ¦R©R R¦R¦¦RR¤`Rv¡R ¡¦R¡¥R¦ST<¦R¡¤¤lRTs R¤¤^R¦Y¥R¡¦¡ R©R¡R¡¢¤¡¥RR¦R¦¦¥R R «R¦¤¡¡¢`R¡§YR¨R¦¡R¡¨R¦R R¦¡RR¦`Rz¡©¨¤RR¥§¤¢¤¥R¦¦R©RRdªR^R§¦R¦«R¤R ¡¦R¦R¡¥¦R¢¡©¤§R R¥¡R¡ Y¦R¦¡¥¥R¦R¥¦¤¦R ¦¡R¦¦`T<¦R¡¤¤lRT¡§Y¤R¡ R¡¡^R§¦R¢R¡ R¡§¦`R{YRRR RR¦¦R¦R¡¤R©¦R¡¤R¤ ¡¤ ¦¥`T<<na¦§¤ p<<n¦§¤ Rhp<<R§ ¦lRc^RT¦¦R T^Rb^j<R§ ¦lRc^RTs  ¦¡¤R T^Rc^j<R§ ¦lRc^RT¡¦R¤§T^Rb^k<R§ ¦lRc^RTxR T^Rb^cb<¦R¡¤¤lRT¡©SR¡§Y¤R¡ R¥¡R©R©¦¡§¦R`Ry¡¡R¡¤R«¡§SSRz¤Y¥R¡¤R¦¤¡¡¢¥`R{YRRR¥¡¡ R ST<<<na¦§¤ p<<n¦§¤ Rjp<<R§ ¦lRc^RT¦¦R T^Rb^j<R§ ¦lRc^RTs  ¦¡¤R T^Rc^j<R§ ¦lRc^RT¡¦R¤§T^Rb^k<R§ ¦lRc^RT¡¤¢¡ R T^Rb^cb<R§ ¦lRc^RT¡¤¢¡ R T^Rc^k<¦R¡¤¤lRT¥R¥R¦`R¥R¥RR{R¡§R¤ `R¥R¦RRR¦¡§R¦¦R¥¦R¦¡R¡`T<©¦lRc<¦R¡¤¤lRTt§¦R{R¨R¦R R«¡§`T<<na¦§¤ p<m",


				"d¥ikxcm¤¤«R¦R¦R  ¥§mcimccmcdlchlchlclclcdlclclclclglchlclclclglglglglglglglchlclclglglclclglglglclchlclclglclclclglclclclchlclclglclclclglclclclchlclclglcldlclglcldldlcdlchlclglclclclglcldlclcdlchlclglclclcdlcilcdlclflcdlcdlchlcilcdlcdlcdlcilcdlclflcdlcdlchlcilcdlcdlcdlcilchlclflcdlchlclglclchlcdlcilcdlflflchlclclglclclclglclflflclclglglcldlclgldlflflclglglclclclglglclflflglglclclclclglclclflflclclclclclglglcldlfljlclclclclglglclclflflflmlt§lmd^h^f^bld^h^g^bld^h^h^bld^cd^f^cld^ce^f^cld^ce^g^cld^cf^i^clc^g^f^blc^g^g^blc^g^h^blg^f^g^blj^g^e^blj^d^e^blj^d^i^blj^f^i^bli^d^h^blh^d^k^blcc^cf^c^clcc^cf^h^cle^cd^g^cle^i^g^blcb^c^g^bli^c^f^blcg^ch^d^clcg^ch^i^clcg^ch^h^clj^cg^b^clj^ch^c^clj^ch^b^clj^ce^b^clj^cg^d^clj^ch^e^clh^e^e^blmmbbb_glbc_glbd_glce_glcf_glmn¥¦¤¦p<<¦R¡¤¤lRTR¨R¦¡R¢R¡ SR¤R¥R R§ §¥R¥¦¤¦R¥¦¤¡ ¡R§¢RST^RT{R©R R£§«R¦R§¢R¦¤R©R R¢¦§¤R¥¡R¡R¦R§ §¥R¤¥¡§¤¥R R§¥R¦R¦¡R¥§¤¨¨R¡¤R¦R§ ¦R¦R¨R¤«R¤¤¨¥R R¢¥R§¥R¦§¤ R¦R¦¦R¦© R§¥R Ry  ¡ `T<<lRc^Rg<¦R¡¤¤lRTz¤R¥RR¤«R¥¦¤¦R§ ¦R¡¤R¡¦¦ R¢¡¥¦¡ ¥^RR©R§¥R¥¦R¦`T^RT{¦R©R¥¦R¦¤¡§R¦R «R«¡§R¦¦^R RR©¦¨¤R¥R¤¦«R R¦R¥R©`T<lRf^Rg<¦R¡¤¤lRT¥R¦¥R¦¡R«¡§¤R¨ ¦R¡ R©¦R¦R¡¦R¤§R¦¡RR¦¦R«R¦¦`T<§ lRc^Rg<§ lRf^Rg<¦R¡¤¤lRTR «R¥¡R¥RR©R¦¦R ¥R¥R©R¦¥R¦`T<<lRi^Rg<<¦R¡¤¤lRT¥R¥RRR|¤R¤§`T^RT{¦R©R¦¦R «Rz R¨¥R R¦R¥§¤¤¡§  R¤`T^RT{¦R Y¦R¦¦^R§¦R¦Y¥R¥¦RR§¥§R¢R¡R ¤«`T<<§ lRi^Rg<<¦R¡¤¤lRT{¦R¡¡¥RR¦Y¥R¡ R¦¡R¤ R¥¡¡ ``R¥R¥¡©¥R¡© R¦¤¡¡¢¥R R¤§¥R¦¦¥`T<¦R¡¤¤lRT¥^R¥¦«R¥R¡§¦R¦¤``T<<na¥¦¤¦p<m",


				"w¦vdt{m¤Rv¡© mckmcimcdlcdlcdlcdlcdlchlchlclclflclclclclglclclcdlcglcdlcelchlclclclclflclclclclglclclcdlcglcdlchlclclflflclclclclclclglclclcdlcdlcdlchlclflclflflclclflclclglglglcdlcdlchlclflflflclclflclclclclglclclcdlchlclflflilflflclclelclclclglclclcdlchlclflcljlilclelelclclelglglclclcdlchlclclflflflflflelelelelglelclclcdlchlclflflclililflclelelelglelclelcdlchlclflflflilfldlclclclelglclelclcdlchlflclelcleldlflfldlclglglelelclchlflclclelelflcldlflclclglelcleldlclflclelclelelclclclclclglclcldlflclclclclelcleleldlclclglglcldldlflclclclclelglglglglglglglclcldlflflclclclglglglelclelelclclcldldlflflglglglglclelelclcleleleldlflflflflclclglclclclclelelelcleldlflflflflclclglclclclclelclelcldlflflflflflmlt§lmc^j^cd^blc^h^cd^blc^f^cd^blcb^c^cd^blcb^d^cd^blh^e^cd^blg^ch^d^clg^ch^b^clcc^cj^d^clcc^ch^c^clj^ci^d^clj^cg^c^cld^i^ce^bld^h^ce^bld^e^cf^bld^j^cg^blc^g^cf^blc^i^cf^blc^h^cg^blc^i^ch^blc^e^ce^blc^f^ce^blg^e^ch^blg^c^cf^bli^b^cf^bli^b^cg^bli^c^cg^bli^d^cf^blmi^cj^c^cli^ci^b^clg^ci^c^clj^cj^b^cld^cg^d^clg^cc^i^_clg^k^k^_cle^cb^cc^_cld^cc^cc^_clj^k^cc^_clj^cd^cc^_clj^ce^k^_clj^ci^cb^_clj^cg^cc^_clj^cd^ce^_clj^cc^cf^_clj^k^cf^_clmbmn¥¦¤¦p<<¦R¡¤¤lRTz¤R¦R¥SRR§ §¥R¥¦¤¡ ¡SSR R¡¡ ¥¥R©R©¤R£§R ¡§`RR R¦¡R¢¦§¤R¦¥R¡¤Ry  ¡ R¡¥ST^RTR¥¡§R¨RR ^R§¥R«¡§¤R  ¦¤«R¦¤¡¡¢¥R¦¡R¢¦§¤R¦R«R¡¦¡ ¥`T<<¡¨lRch^cg<lRk^Rcc<lRk^Rcf<lRcc^Rcf<lRcd^Rce<lRcd^Rcc<lRce^Rk<lRcg^Rcc<lRci^Rcb<<©¦lRd<¦R¡¤¤lRT¥R¡R§ ¥R¢¤¡¨R ¡R¡¤R«¡§R¦¡R§¥R§¤ R¦¦`T<<§ lRk^Rcc<§ lRk^Rcf<§ lRcc^Rcf<§ lRcd^Rce<§ lRcd^Rcc<§ lRce^Rk<§ lRcg^Rcc<§ lRci^Rcb<<<lRk^Rk<lRcc^Ri<<©¦lRd<¦R¡¤¤lRT¥R¥¢¡¦¥R©RR©¤R«¡§R R§Rª¦¤R¦¤¡¡¢¥R¦¡R¢R¦¥R¦`T<<§ lRk^Rk<§ lRcc^Ri<<<lRcb^Rcc<lRcc^Rcc<<©¦lRd<¦R¡¤¤lRTz¡©¨¤^R¡R¡ R¥ Y¦R ¡§R¦¡R  R¦¤¡¡¢¥`R¥R¡¦¡ ¥R¡¤R ¦R R¢¤¦R¥§¢¢«R¤£§¤R¦¡R§Ry¤¡§ R¦¤¡¡¢¥R¡¤Rs¤R¦¤¡¡¢¥`T^RTwR§ R¥R¤£§¤R¡¤R¦¤R¤¥¢¦¨R¦¡RR§¦`T<<§ lRcb^Rcc<§ lRcc^Rcc<<<na¥¦¤¦p<<<n¦§¤ Rdp<<¦R¡¤¤lRTsSRR ¡ST<<¡¨lRg^Rb<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rf^Rh<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rg^Re<R§ ¦lRd^RT¦¤Ru¡ ¡T^Ri^Rf<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rj^Re<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rcd^Re<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rcf^Rh<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rce^Rc<©¦lRc<<¡¨lRcj^Rcf<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rch^Rch<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rci^Rcf<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rcj^Rcg<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rcj^Rce<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rcj^Rcc<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rci^Rj<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rcj^Rh<©¦lRc<<¡¨lRj^Rb<R§ ¦lRd^RT¢¤R T^Rk^Rd<R§ ¦lRd^RT¢¤R T^Rcc^Rd<©¦lRc<<<¦R¡¤¤lRTR ¡SR«R§¥R§¥SRR©¤ Y¦R£§R ¡§`T<<¦R~ lRT¦R¤R©R¡ R¦¡R¡qT<<¦R¡¤¤lRTR¨R¦¡R¢¤¥¥R¡ ^RR©R¡RR ¡©R¦«YR§¥¦R¡¡©R§¥R R R§¥RR¦R¦R  ¥§`R§¤R¡¤¥R¤R¦¡¡R© R¦R¦R¡ ¦`T<¦R¡¤¤lRT§¤R¡ «R¡¢R¥R¦¡R£§«R¢¦§¤R¦R¥¦¤¡ ¡R¤R¡¤R¦¤R  ¦¤«R¦¤¡¡¢¥R¢¦§¤R¦`T<<©¦lR`g<¦R¡¤¤lRT¡§Y¨R¢§R¤¥R¡¤R¦¥R¢¥¦R©R©¥`R}¢R¦R§¢^R¡§¤R R¥R¡¥¦R R¥¦ST<<<na¦§¤ p<m",


				"i}ukgm¦ ¡R¡¤¥mcjmcfmcglcdlchlchlclclfljlilclclglclclcdlchlclflflflclilflclelglclclcdlchlclclclclflflflglclglclclcdlcdlchlclcldlflelglglglglglglcdlcdlchlflflfldlflhlhlclglclclcdlcdlchlclclclfldlflhlhlglelclcdlcdlcdlchlchlhlflflflhlhlglclelcdlcglcdlcdlchlhlflflhlflhlglclclcdlcdlcglcdlcdlchlchlflhlhlhlglclelcdlcdlcdlcdlcdlcdlchlclfldlhlglclclchlchlchlchlclchlhlfldldlhlglclclclclclclclelflhlhlclflglglclglglglhlflflflflflclflclglglclclglflflhlhlhlhldldlelclglclklglglglglglglhlfldlclelglglglglclclglhlglhlflclclclglglclglklclglhlglglglglglglglglclglclklglhlhlhlclflclclglmlt§lmcd^d^k^blcd^ce^d^clcd^cg^d^clg^cg^c^cle^cg^h^cld^ce^g^cld^cg^g^cld^ch^g^cld^ci^g^cld^ci^f^cld^ce^e^cld^cf^e^clcc^cf^f^clcc^ch^d^clcc^cf^d^cli^ci^b^cli^cd^b^cli^cd^c^clc^f^k^blc^g^k^blc^h^k^blc^i^cb^blc^e^h^blc^f^i^blc^i^j^blc^j^j^blc^k^cb^blf^f^cc^blg^h^cc^blh^e^cb^bli^e^ce^bli^c^cc^blcb^d^cc^bld^j^cc^bld^j^cb^blmd^c^cd^bli^ch^c^clc^ci^c^cli^ce^c^cli^ce^b^cld^cf^b^cld^ci^e^cle^cg^e^clf^cc^b^clf^cc^c^clf^cc^d^cle^ch^f^clg^cg^f^clg^cc^f^clh^cb^c^clcb^j^b^clcb^g^b^clcb^k^e^cle^d^cd^blg^f^cb^blg^d^cb^blg^f^cd^bli^b^cb^bli^c^k^bli^d^ce^bli^f^ce^blj^cd^k^_clj^cc^k^_clj^k^i^_clj^d^g^_clj^e^f^_clj^cf^cc^_clj^k^ce^_clj^i^ce^_cli^cc^e^clc^b^cd^bli^ci^k^_cli^cg^cb^_cli^ci^i^_cli^ce^i^_clmbmn¥¦¤¦p<<¦R¡¤¤lRT¥R¥¡§RR¡§¤R R¥¦ ¡`RR R¦¡R¥§¤¨¨R¦¥R¦¦`T<¦R¡¤¤lRTR¨R ¦¤ R¦R¤R R¥§¤R¥¡R¢¡¤¦ ¦R§ ¥R R¦¥R¡¤R ¥`T<<©¦lR`g<<¦R¡¤¤lRT ¡¤¦§ ¦«R¦R¡¡¥RRy  ¡ RR¦R¥``R¦¥R¥R ¡¦R¡ R¦¡RR R¥«R¦`T<¦R¡¤¤lRTR «R¤R¥¥R¦¡R¨R¡¤¦RR¥¦¤¡ R ¥R©¦R¦¥R¡¦¦ ¥R§¢R`Rs R¦R¥¥R¦¤R¨R¦¥R¨R¡R¤«`RtR¤R¡R¢¡¦¥¡¦¥R¡ R¤¡R¦R¥¥`T<¦R¡¤¤lRT```y¡¡R§R R¥¦«R¥¦¤¡ `T<<na¥¦¤¦p<m"
			]


				//** CAMPAIGN 3 **//
			,[
				"fctfjgvmz Rz¥mcdmcdmclelclclclelflflclclclelelclclcldlglglglglglclclglglglglglglflclclglglclclclclclelflflelclelglclflclcclclflflflflclclglclflflflflflcdlcdlchlchlclglclclelclflflclcdlcdlcdlcdlglelclelclelcclflglglchlcdlcilcdlclclelelflclgldlchlcdlglcdlclclcblflflglglglcdlchlglchlelclflclglglcdlglcdlglglclclelflclglclcdlglglglelclmlt§lmc^k^b^clc^cc^d^clc^cc^k^clc^cc^cc^clc^j^cb^clc^c^d^blc^d^e^blc^b^e^blc^d^b^blc^b^c^bli^c^c^blf^c^f^blg^i^h^bli^j^g^blc^e^k^blc^d^cc^blc^f^cc^bld^cb^cb^cld^cb^e^clf^cc^i^clh^j^i^clmc^b^b^blc^i^d^clmbbb_hlbc_hlbd_hlbe_hlcf_hlcg_hlmn¥¦¤¦p<<§¤¦R§ ¦lRj^i^Rdb<¦R~ lRT¢RST<¡¨lRj^j<¦Ry  ¡ lRTzST^RT{R¡¢R«¡§Y¤R¤«R¦¡R¡¥`T<R§ ¦lRd^RTs  ¦¡¤R T^Rj^h<©¦lRc<R§ ¦lRj^g<©¦lRc<R§ ¦lRi^h<©¦lRc<¡¨lRcd^Rcd<©¦lRc<R§ ¦lRd^RT¡¤¢¡ R T^Rk^i<R§ ¦lRd^RT¡¤¢¡ R T^Rj^j<R§ ¦lRd^RT¡¤¢¡ R T^Rcb^g<R§ ¦lRd^RT¡¤¢¡ R T^Rcc^f<©¦lRc<¦R~ lRTST<¦Ry  ¡ lRTsST<<©¦lRc<¦R¡¤¤lRT~ SR{YR¤R¦¡R¢ST<¦R~ lRT¡R¤R«¡§qT<¦R¡¤¤lRT{YR¨R¦R¦¡Rª¢ R¦¤R©R¦R¡§¦R¡R¦¥R¥¦§¦¡ `T<lRj^h<¦R¡¤¤lRTx¤¥¦R¡RR¦¦RR¦ R¦¦R§¥¦R¥¦¤¡«R«¡§¤R¦¤¡¡¢¥R¥RR¦Rs  ¦¡¤R `T<¦R¡¤¤lRTv¡ Y¦R¦¤«R¦¡R¦RR¡ R©¦R¦R¦¤¡¡¢¥R«¡§R¨R¦R R¦¥R¦¦^R¦R¥Rz¨«Rv ¥R R ¥R¦¡RR¦ R¡ R«RRz¨«Rs¦¦¤`T<§ lRj^h<<¡¨lRb^Rb<lRb^c<lRc^d<lRd^e<lRb^e<lRd^b<¦R¡¤¤lRT¡§¤R  ¦¤«R¦¤¡¡¢¥R¦¦R©¦R~¦Rs¦¦^R©R¥R¥§¢¤R ¦¨`T<§ lRb^c<§ lRc^d<§ lRd^e<§ lRb^e<§ lRd^b<lRc^c<lRc^f<¦R¡¤¤lRT¡§¤R¦ R R¡¤¦¤R¦¦R©¦R§Rs¦¦^R©R¥R §¦¤^R§¦R¦¡¥R¦©¡R ¡¦R ¡§R¦¡RR`T<§ lRc^c<§ lRc^f<<<¡¨lRi^Rd<lRi^d<¦R¡¤¤lRTR¥¦R¢ R¡R¦¡ R¤R©¡§RR¦¡R¦¤¦R¦¤Ru¢¦`R{R«¡§R¢¦§¤R¦¤Ru¢¦^R¦R ¥R¡¤¥R©R¢¦R¡¢¦«R R¦«R©R¨R§¢`T<¦R¡¤¤lRT¡§R R¢¦§¤R «R§ ¥R«R¦¤¦ R«¡§¤R  ¦¤«R¦¤¡¡¢¥R¡¨¤R¦`T<¡¨lRb^Rb<lRd^e<¦R¡¤¤lRT R¦¥R  ¦¤«R¦¤¡¡¢R¡¨¤R¦¤^R R¤ ¡¤RR©¦R«¡§¤R¡¦¤R¦¤¡¡¢¥`T<¦R¡¤¤lRT{ R¦¥R¦¤¤ ^R«¡§¤R¦¤¡¡¢¥R©RR R«R¦R¡§ ¦ ¥^R§¥R¦ ¥R R¦¤§¥R  ¡¦R¤¨R¡¨¤R¡§ ¦ ¥`T<§ lRi^d<§ lRd^e<<¦R¡¤¤lRT¦Y¥RR¡¤R ¡©`Ry¡¡R§`T<<na¥¦¤¦p<<n© p<¦Ry  ¡ lRTs¤¤¤ST<¦R¡¤¤lRT¥SR{R ©R«¡§R¡§R¡R¦`R§^R¦Y¥R¡¨R R{YRª¢ R¨¤«¦ `T<na© p<<n¡¥p<¦R¡¤¤lRTz¤Y¥RR¦¦R¦¢lR~¦Rs¦¦¥R¤R¥§¢¤R¦¨R¦¡R~¦Rs¤¡¤^Rz¨«Rs¦¦¥R¤R¨¤«R ¦¨R ¥¦R~¦Rs¤¡¤`R§Rs¦¦¥R¤R §¦¤`T<¦R¡¤¤lRTuRR¤¡¡¢R¦¡R¥R ¡R¡§¦R¦Y¥R¦^R¦¦R¢¡©¤^R¦¦R¦«¢^R R¤¡¤R¦«¢`T<¦R¡¤¤lRT¤«R SR¡§R©¤R§¥¦R¥¡R¡¥R¦¥R¦`T<na¡¥p<<<n¦§¤ Rfp<<¦R¡¤¤lRT¡§Y¤R¡ R©`R}¢R¦R§¢ST<<na¦§¤ p<m",


				"h {s}jm¡ ¡R¡¤mcdmcdmclclclclclclclclglclclelclclglglglglglglglclelflglglglcdlcdlcdlcdlcdlclclclcdlcdlcilcdlchlflflflchlcdlcdlcdlcdlclclclflflflflflflcdlcglcdldlcldlclflflfljlflflcdlcdlclelclclclflflflflflflchlclclcblklclclclclflflflflelclclclclclcblclclflflflclelclclclclclclclclflflelcblclclclclclcclclclclflcblclklclclclclclclclclflmlt§lmd^b^b^bld^c^f^blc^b^e^blc^c^j^blg^c^h^blf^b^j^blh^b^k^blce^i^i^clce^j^j^clce^i^h^clce^i^g^clce^k^k^clce^cb^cb^clce^cc^cb^clce^j^f^clce^cb^f^clce^cc^f^clce^k^f^clcd^cb^i^clcc^k^b^clcc^h^c^clcc^j^d^cld^h^e^cld^cc^c^cld^cb^b^cld^b^d^bld^c^cb^blcc^cb^e^clf^g^b^clc^i^b^clc^cb^d^clc^cc^e^clme^cc^k^cld^cb^j^clmbmn¥¦¤¦p<<¦R~ lRT¡©R¦ R«¡§SST^RTR§```T<¦R¡¤¤lRTY¤R ¡¦R¡§¦R¡R¦R©¡¡¥R«¦ST<¦Ry  ¡ lRT{R¨R©«R¦¡¡R «R§ ¦¥R¡¢¤R¦¡R«¡§^R R¤¥¡§¤¥R¨¥¦SR¥R¥RR¤¦R ^R R{R¨R¦R¦¦¤R¤¡§ `T<<lRcb^Ri<©¦lRc<¦R¡¤¤lRT~ R¦¥R¥¥RR¦¤¡§SRy  ¡ R¥R¡¤R¤¥¡§¤¥R R¡¤R¦¤¡¡¢¥R¥R©`Rs R¦¦R¤R R¥RRR¤ `R{¦R R§R¤ ¡¤ ¦¥R§¥ R¤¡§¤¥¥R¦R¡¦¥R¤¡R¦R¤¡§ `T<§ lRcb^Ri<<lRi^Rd<lRi^Re<lRj^Rh<lRcb^Rc<lRcc^Rb<lRcc^Rd<<©¦lRf<<§ lRi^Rd<§ lRi^Re<§ lRj^Rh<§ lRcb^Rc<§ lRcc^Rb<§ lRcc^Rd<<<¦R¡¤¤lRTR¨R¦¡R§¥R¦¨R¥¦¤¦«R¦¡R¨¡R« R¤`R~¦Y¥R¨R¡§¤R¦¤¡¡¢¥R§RR¦¤ R¡ R¦R¡¥¦R¥¡R¦¦R©R R§ ¤R¡© R R¤¦RR ¥¨R¢¡¥¦¡ `T<<¡¨lRb^bR<©¦lRc<¦¤¤ lRTu «¡ T^Rd^Rb<©¦lRc<¦¤¤ lRTu «¡ T^Rd^Rc<©¦lRc<¦¤¤ lRTu «¡ T^Rd^Rd<©¦lRc<<¦R¡¤¤lRTu «¡ ¥R¢¤¡¨R¡¡R ¥R¦¡R«¡§¤R¦¤¡¡¢¥R R¡ ^R R¥¡R¥¦¡¢R¡ R¤ R©¢¡ ¤«R¤¡R R¦¨R ¥¦R«¡§¤R¦¤¡¡¢¥R R¦R¦¤ ¥`T<¦R¡¤¤lRTt¤¥R R¡¥R¢¤¡¨R¨¤«R¦¦R ¥^R¥¡R¡ ¥¤R¦¥R©R«¡§R §¨¤R«¡§¤R¦¤¡¡¢¥`R¥R¦¥R¦¡R«¡§¤R¨ ¦R¦R¦¥R¡R¢¡ ¦`T<¦R¡¤¤lRTu¡R¦R «R¢¡¥¦¡ R¡§¦^R R¡ Y¦R¦R¦R¨ R¡ R«¡§SR¡§¤Rz¨«Ru¡ ¡¥R¤R£§¢¢R¦¡RR©¦Rz¨«Rs¤¡¤R¦ ¥RR¦¡¥R¢¥«Rs  ¦¡¤Y¥R¦¦R¨R§¥R¦¤¡§R¡¤`T<¦R¡¤¤lRTtR¤§^R¦¥R©¡ Y¦RR¥«R¥R¦R «R¤ R R¥¦R§`R¦«R¨R©R«¡§R R R¡ Y¦R¡¥R¦R¢¨¡¦R¢¡¥¦¡ SRy¡¡R§R¤^R{YR¡ R¦¡R¡RR¡¤R¤ ¡¤ ¦¥`T<¦R¡¤¤lRT{YRRR¥¡¡ ^RR¥§¤R¦¡R¢R¦R¤R¡©R¦R¤¡¥R¤R¥¡R©R¨R¥¢R¦¡R¤ R R¦R¤ ¡¤ ¦¥`T<<na¥¦¤¦p<<n¦§¤ Rep<<R§ ¦lRc^RT¦¦R T^Rb^j<¦R¡¤¤lRTz«SR{YR`Rs R©¦RR¢¤¥ ¦R«¡§Y¤R¡  R¡¨SR¥RR¡«¥R¤R¦¦R ¥`T<¦R¡¤¤lRTs¦¤R¦«R¡¨^R¦«R©R¦§¤ R ¨¥R¦¡R¦R «RR¦¤R¥R ¡R «R¦¤¡¡¢R ¤R¦`R¥R ¥R¦«R RR§¥R¦¡R¡R ¡ R¦¦¥^RR¦R «R¤§ ¥R ¦¡R¦SR¥R§ ¦R©R R¦R¦¦RR¤`Rv¡R ¡¦R¡¥R¦ST<¦R¡¤¤lRTs R¤¤^R¦Y¥R¡¦¡ R©R¡R¡¢¤¡¥RR¦R¦¦¥R R «R¦¤¡¡¢`R¡§YR¨R¦¡R¡¨R¦R R¦¡RR¦`Rz¡©¨¤RR¥§¤¢¤¥R¦¦R©RRdªR^R§¦R¦«R¤R ¡¦R¦R¡¥¦R¢¡©¤§R R¥¡R¡ Y¦R¦¡¥¥R¦R¥¦¤¦R ¦¡R¦¦`T<¦R¡¤¤lRT¡§Y¤R¡ R¡¡^R§¦R¢R¡ R¡§¦`R{YRRR RR¦¦R¦R¡¤R©¦R¡¤R¤ ¡¤ ¦¥`T<<na¦§¤ p<<n¦§¤ Rhp<<R§ ¦lRc^RT¦¦R T^Rb^j<R§ ¦lRc^RTs  ¦¡¤R T^Rc^j<R§ ¦lRc^RT¡¦R¤§T^Rb^k<R§ ¦lRc^RTxR T^Rb^cb<¦R¡¤¤lRT¡©SR¡§Y¤R¡ R¥¡R©R©¦¡§¦R`Ry¡¡R¡¤R«¡§SSRz¤Y¥R¡¤R¦¤¡¡¢¥`R{YRRR¥¡¡ R ST<<<na¦§¤ p<<n¦§¤ Rjp<<R§ ¦lRc^RT¦¦R T^Rb^j<R§ ¦lRc^RTs  ¦¡¤R T^Rc^j<R§ ¦lRc^RT¡¦R¤§T^Rb^k<R§ ¦lRc^RT¡¤¢¡ R T^Rb^cb<R§ ¦lRc^RT¡¤¢¡ R T^Rc^k<¦R¡¤¤lRT¥R¥R¦`R¥R¥RR{R¡§R¤ `R¥R¦RRR¦¡§R¦¦R¥¦R¦¡R¡`T<©¦lRc<¦R¡¤¤lRTt§¦R{R¨R¦R R«¡§`T<<na¦§¤ p<m",


				"d¥ikxcm¤¤«R¦R¦R  ¥§mcimccmcdlchlchlclclcdlclclclclglchlclclclglglglglglglglchlclclglglclclglglglclchlclclglclclclglclclclchlclclglclclclglclclclchlclclglcldlclglcldldlcdlchlclglclclclglcldlclcdlchlclglclclcdlcilcdlclflcdlcdlchlcilcdlcdlcdlcilcdlclflcdlcdlchlcilcdlcdlcdlcilchlclflcdlchlclglclchlcdlcilcdlflflchlclclglclclclglclflflclclglglcldlclgldlflflclglglclclclglglclflflglglclclclclglclclflflclclclclclglglcldlfljlclclclclglglclclflflflmlt§lmd^h^f^bld^h^g^bld^h^h^bld^cd^f^cld^ce^f^cld^ce^g^cld^cf^i^clc^g^f^blc^g^g^blc^g^h^blg^f^g^blj^g^e^blj^d^e^blj^d^i^blj^f^i^bli^d^h^blh^d^k^blcc^cf^c^clcc^cf^h^cle^cd^g^cle^i^g^blcb^c^g^bli^c^f^blcg^ch^d^clcg^ch^i^clcg^ch^h^clj^cg^b^clj^ch^c^clj^ch^b^clj^ce^b^clj^cg^d^clj^ch^e^clh^e^e^blmmbbb_glbc_glbd_glce_glcf_glmn¥¦¤¦p<<¦R¡¤¤lRTR¨R¦¡R¢R¡ SR¤R¥R R§ §¥R¥¦¤¦R¥¦¤¡ ¡R§¢RST^RT{R©R R£§«R¦R§¢R¦¤R©R R¢¦§¤R¥¡R¡R¦R§ §¥R¤¥¡§¤¥R R§¥R¦R¦¡R¥§¤¨¨R¡¤R¦R§ ¦R¦R¨R¤«R¤¤¨¥R R¢¥R§¥R¦§¤ R¦R¦¦R¦© R§¥R Ry  ¡ `T<<lRc^Rg<¦R¡¤¤lRTz¤R¥RR¤«R¥¦¤¦R§ ¦R¡¤R¡¦¦ R¢¡¥¦¡ ¥^RR©R§¥R¥¦R¦`T^RT{¦R©R¥¦R¦¤¡§R¦R «R«¡§R¦¦^R RR©¦¨¤R¥R¤¦«R R¦R¥R©`T<lRf^Rg<¦R¡¤¤lRT¥R¦¥R¦¡R«¡§¤R¨ ¦R¡ R©¦R¦R¡¦R¤§R¦¡RR¦¦R«R¦¦`T<§ lRc^Rg<§ lRf^Rg<¦R¡¤¤lRTR «R¥¡R¥RR©R¦¦R ¥R¥R©R¦¥R¦`T<<lRi^Rg<<¦R¡¤¤lRT¥R¥RRR|¤R¤§`T^RT{¦R©R¦¦R «Rz R¨¥R R¦R¥§¤¤¡§  R¤`T^RT{¦R Y¦R¦¦^R§¦R¦Y¥R¥¦RR§¥§R¢R¡R ¤«`T<<§ lRi^Rg<<¦R¡¤¤lRT{¦R¡¡¥RR¦Y¥R¡ R¦¡R¤ R¥¡¡ ``R¥R¥¡©¥R¡© R¦¤¡¡¢¥R R¤§¥R¦¦¥`T<¦R¡¤¤lRT¥^R¥¦«R¥R¡§¦R¦¤``T<<na¥¦¤¦p<m",



				"w¦vdt{m¤Rv¡© mckmcimcdlcdlcdlcdlcdlchlchlclclflclclclclglclclcdlcglcdlcelchlclclclclflclclclclglclclcdlcglcdlchlclclflflclclclclclclglclclcdlcdlcdlchlclflclflflclclflclclglglglcdlcdlchlclflflflclclflclclclclglclclcdlchlclflflilflflclclelclclclglclclcdlchlclflcljlilclelelclclelglglclclcdlchlclclflflflflflelelelelglelclclcdlchlclflflclililflclelelelglelclelcdlchlclflflflilfldlclclclelglclelclcdlchlflclelcleldlflfldlclglglelelclchlflclclelelflcldlflclclglelcleldlclflclelclelelclclclclclglclcldlflclclclclelcleleldlclclglglcldldlflclclclclelglglglglglglglclcldlflflclclclglglglelclelelclclcldldlflflglglglglclelelclcleleleldlflflflflclclglclclclclelelelcleldlflflflflclclglclclclclelclelcldlflflflflflmlt§lmc^j^cd^blc^h^cd^blc^f^cd^blcb^c^cd^blcb^d^cd^blh^e^cd^blg^ch^d^clg^ch^b^clcc^cj^d^clcc^ch^c^clj^ci^d^clj^cg^c^cld^i^ce^bld^h^ce^bld^e^cf^bld^j^cg^blc^g^cf^blc^i^cf^blc^h^cg^blc^i^ch^blc^e^ce^blc^f^ce^blg^e^ch^blg^c^cf^bli^b^cf^bli^b^cg^bli^c^cg^bli^d^cf^blmi^cj^c^cli^ci^b^clg^ci^c^clj^cj^b^cld^cg^d^clg^cc^i^_clg^k^k^_cle^cb^cc^_cld^cc^cc^_clj^k^cc^_clj^cd^cc^_clj^ce^k^_clj^ci^cb^_clj^cg^cc^_clj^cd^ce^_clj^cc^cf^_clj^k^cf^_clmbmn¥¦¤¦p<<¦R¡¤¤lRTz¤R¦R¥SRR§ §¥R¥¦¤¡ ¡SSR R¡¡ ¥¥R©R©¤R£§R ¡§`RR R¦¡R¢¦§¤R¦¥R¡¤Ry  ¡ R¡¥ST^RTR¥¡§R¨RR ^R§¥R«¡§¤R  ¦¤«R¦¤¡¡¢¥R¦¡R¢¦§¤R¦R«R¡¦¡ ¥`T<<¡¨lRch^cg<lRk^Rcc<lRk^Rcf<lRcc^Rcf<lRcd^Rce<lRcd^Rcc<lRce^Rk<lRcg^Rcc<lRci^Rcb<<©¦lRd<¦R¡¤¤lRT¥R¡R§ ¥R¢¤¡¨R ¡R¡¤R«¡§R¦¡R§¥R§¤ R¦¦`T<<§ lRk^Rcc<§ lRk^Rcf<§ lRcc^Rcf<§ lRcd^Rce<§ lRcd^Rcc<§ lRce^Rk<§ lRcg^Rcc<§ lRci^Rcb<<<lRk^Rk<lRcc^Ri<<©¦lRd<¦R¡¤¤lRT¥R¥¢¡¦¥R©RR©¤R«¡§R R§Rª¦¤R¦¤¡¡¢¥R¦¡R¢R¦¥R¦`T<<§ lRk^Rk<§ lRcc^Ri<<<lRcb^Rcc<lRcc^Rcc<<©¦lRd<¦R¡¤¤lRTz¡©¨¤^R¡R¡ R¥ Y¦R ¡§R¦¡R  R¦¤¡¡¢¥`R¥R¡¦¡ ¥R¡¤R ¦R R¢¤¦R¥§¢¢«R¤£§¤R¦¡R§Ry¤¡§ R¦¤¡¡¢¥R¡¤Rs¤R¦¤¡¡¢¥`T^RTwR§ R¥R¤£§¤R¡¤R¦¤R¤¥¢¦¨R¦¡RR§¦`T<<§ lRcb^Rcc<§ lRcc^Rcc<<<na¥¦¤¦p<<<n¦§¤ Rdp<<¦R¡¤¤lRTsSRR ¡ST<<¡¨lRg^Rb<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rf^Rh<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rg^Re<R§ ¦lRd^RT¦¤Ru¡ ¡T^Ri^Rf<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rj^Re<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rcd^Re<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rcf^Rh<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rce^Rc<©¦lRc<<¡¨lRcj^Rcf<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rch^Rch<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rci^Rcf<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rcj^Rcg<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rcj^Rce<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rcj^Rcc<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rci^Rj<R§ ¦lRd^RT¦¤Ru¡ ¡T^Rcj^Rh<©¦lRc<<¡¨lRj^Rb<R§ ¦lRd^RT¢¤R T^Rk^Rd<R§ ¦lRd^RT¢¤R T^Rcc^Rd<©¦lRc<<<¦R¡¤¤lRTR ¡SR«R§¥R§¥SRR©¤ Y¦R£§R ¡§`T<<¦R~ lRT¦R¤R©R¡ R¦¡R¡qT<<¦R¡¤¤lRTR¨R¦¡R¢¤¥¥R¡ ^RR©R¡RR ¡©R¦«YR§¥¦R¡¡©R§¥R R R§¥RR¦R¦R  ¥§`R§¤R¡¤¥R¤R¦¡¡R© R¦R¦R¡ ¦`T<¦R¡¤¤lRT§¤R¡ «R¡¢R¥R¦¡R£§«R¢¦§¤R¦R¥¦¤¡ ¡R¤R¡¤R¦¤R  ¦¤«R¦¤¡¡¢¥R¢¦§¤R¦`T<<©¦lR`g<¦R¡¤¤lRT¡§Y¨R¢§R¤¥R¡¤R¦¥R¢¥¦R©R©¥`R}¢R¦R§¢^R¡§¤R R¥R¡¥¦R R¥¦ST<<<na¦§¤ p<m",


				"i}ukgm¦ ¡R¡¤¥mcjmcfmcglcdlchlchlclclfljlilclclglclclcdlchlclflflflclilflclelglclclcdlchlclclclclflflflglclglclclcdlcdlchlclcldlflelglglglglglglcdlcdlchlflflfldlflhlhlclglclclcdlcdlchlclclclfldlflhlhlglelclcdlcdlcdlchlchlhlflflflhlhlglclelcdlcglcdlcdlchlhlflflhlflhlglclclcdlcdlcglcdlcdlchlchlflhlhlhlglclelcdlcdlcdlcdlcdlcdlchlclfldlhlglclclchlchlchlchlclchlhlfldldlhlglclclclclclclclelflhlhlclflglglclglglglhlflflflflflclflclglglclclglflflhlhlhlhldldlelclglclklglglglglglglhlfldlclelglglglglclclglhlglhlflclclclglglclglklclglhlglglglglglglglglclglclklglhlhlhlclflclclglmlt§lmcd^d^k^blcd^ce^d^clcd^cg^d^clg^cg^c^cle^cg^h^cld^ce^g^cld^cg^g^cld^ch^g^cld^ci^g^cld^ci^f^cld^ce^e^cld^cf^e^clcc^cf^f^clcc^ch^d^clcc^cf^d^cli^ci^b^cli^cd^b^cli^cd^c^clc^f^k^blc^g^k^blc^h^k^blc^i^cb^blc^e^h^blc^f^i^blc^i^j^blc^j^j^blc^k^cb^blf^f^cc^blg^h^cc^blh^e^cb^bli^e^ce^bli^c^cc^blcb^d^cc^bld^j^cc^bld^j^cb^blmd^c^cd^bli^ch^c^clc^ci^c^cli^ce^c^cli^ce^b^cld^cf^b^cld^ci^e^cle^cg^e^clf^cc^b^clf^cc^c^clf^cc^d^cle^ch^f^clg^cg^f^clg^cc^f^clh^cb^c^clcb^j^b^clcb^g^b^clcb^k^e^cle^d^cd^blg^f^cb^blg^d^cb^blg^f^cd^bli^b^cb^bli^c^k^bli^d^ce^bli^f^ce^blj^cd^k^_clj^cc^k^_clj^k^i^_clj^d^g^_clj^e^f^_clj^cf^cc^_clj^k^ce^_clj^i^ce^_cli^cc^e^clc^b^cd^bli^ci^k^_cli^cg^cb^_cli^ci^i^_cli^ce^i^_clmbmn¥¦¤¦p<<¦R¡¤¤lRT¥R¥¡§RR¡§¤R R¥¦ ¡`RR R¦¡R¥§¤¨¨R¦¥R¦¦`T<¦R¡¤¤lRTR¨R ¦¤ R¦R¤R R¥§¤R¥¡R¢¡¤¦ ¦R§ ¥R R¦¥R¡¤R ¥`T<<©¦lR`g<<¦R¡¤¤lRT ¡¤¦§ ¦«R¦R¡¡¥RRy  ¡ RR¦R¥``R¦¥R¥R ¡¦R¡ R¦¡RR R¥«R¦`T<¦R¡¤¤lRTR «R¤R¥¥R¦¡R¨R¡¤¦RR¥¦¤¡ R ¥R©¦R¦¥R¡¦¦ ¥R§¢R`Rs R¦R¥¥R¦¤R¨R¦¥R¨R¡R¤«`RtR¤R¡R¢¡¦¥¡¦¥R¡ R¤¡R¦R¥¥`T<¦R¡¤¤lRT```y¡¡R§R R¥¦«R¥¦¤¡ `T<<na¥¦¤¦p<m"
			]
		],
		id:[1100, 1101, 1102]
	};

	this.Run_Script = function(Game, script)
	{
		Game.Script(new Script_Reader(Game, script));
	};
	this.Report_Unlocked = function(level)
	{
		unlocked_levels = level;
	};

	this.Name = function(lvl)
	{
		if(lvl>unlocked_levels || lvl<0)
			return "Nah";
		return LevelData.Name[lvl];
	};
	this.Data = function(section, lvl)
	{
		if(section>unlocked_levels.length || section<0)return;
		if(lvl>unlocked_levels[section] || lvl<0)return;
		return LevelData.Map[section][lvl];
	};
	this.Unlocked = function(num)
	{
		return (num<=unlocked_levels);
	};
	this.Current = function()
	{
		return unlocked_levels;
	};
};
var Levels = new Levels_Class();
