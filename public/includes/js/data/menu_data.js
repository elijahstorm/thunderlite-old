Menu.Button = [	"#056937",	"#08AF5C",	"#726962",	"#FFB200",	"#4B5148",	"#FDF5BF",	"#5B74FF"];
				// back	 	// hover	// shadow	// text		// idle		// active	// act.txt

/*** Map Editor ***/
Menu.MapEditor = new Menu.Menu_Class("#7F9172");
Menu.MapEditor.Open = function()
{
	Animations.Retrieve("Load").Remove_All();
	with(Menu.MapEditor){
		let SERVER = {
			LOAD:'download',
			SAVE:'update',
			PLAYTEST:'mark playtested',
			DELETE:'delete',
			PUBLISH:'publish',
			new_map:true,
			Report_List:null,
			onReportGameList:function(fnc)
			{
				SERVER.Report_List = fnc;
			}
		};
		let SFX = SFXs.Retrieve("editor sheet");
		let MUSIC_CHANGING = false;
		if(!MUSIC.Name().includes("editor"))
		{
			Music.Stop_All();
			MUSIC = Music.Retrieve("editor plains").Play();
			Music.Retrieve("editor water").Play().Howl().volume(0);
		}
	 	let oldcloser = Menu.MapEditor.Close;
		Menu.MapEditor.Close = function()
		{
			Music.Retrieve("editor water").Stop();
			Music.Retrieve("editor plains").Stop();
			oldcloser();
		};
		function Change_Music(change)
		{
			if(MUSIC_CHANGING)return;
			MUSIC_CHANGING = true;
			MUSIC = MUSIC.Switch(Music.Retrieve("editor "+change), 3000);
			setTimeout(function(){
				MUSIC_CHANGING = false;
			}, 3000)
		}
		function Play_Placement_SFX(type)
		{
			SFX.Play_Out(Math.floor(Math.random()*(SFX.Sprite_Amount())));
		}

		function send_map_data_to_server(type, data)
		{
			if(!online)return;
			if(SERVER.new_map && type=='update')
				type = 'upload';

			socket.emit('mapdata '+type, {name:socket.username,pass:socket.password}, data);
		}
		Menu.MapEditor.Server_Response = {
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

		function Map_Data_To_Str(){
			var str = ""+id+";";
			str+=name+";";
			str+=width+";";
			str+=height+";";
			for(var i=0;i<map_list.length;i++)
				str+=map_list[i]+":";
			str+=";";
			for(var i=0;i<max_players;i++)
				str+=players[i]+":";
			str+=";";
			for(var i=0;i<units.length;i++)
				str+=units[i]+":";
			str+=";";
			for(var i=0;i<cities.length;i++)
				str+=cities[i]+":";
			str+=";";
			str+=(weather[0] ? "1" : "0");
			for(let j=1;j<weather.length;j++)
			{
				str+=""+weather[j][0]+""+weather[j][1]+"-"+weather[j][2]+":";
			}
			str+=";";

			return str+__script__+";";
		}
		Menu.MapEditor.Log_Data = function()
		{	// delete this later
			return encrypt_game_data(Map_Data_To_Str());
		};

		var POPUP_TINTER = new Canvas.Drawable(Shape.Box, null,
							-10, -10, 900, 900, "#ccc", null, .2),
			POPUP_INDEX = -1,
			POPUP_LENGTH = 0,
			POPUP_CLOSER = function(){
				if(POPUP_INDEX!=null)
					Remove(POPUP_INDEX, POPUP_LENGTH);
				POPUP_INDEX = -1;
				POPUP_LENGTH = 0;
				if(	Menu.MapEditor.Current_Scale!=null)
				{
					document.getElementById('inputHandler').removeChild(document.getElementById('canvasScriptInput'));
					document.getElementById('inputHandler').removeChild(document.getElementById('learnScriptLink'));
				}
				Menu.MapEditor.Current_Scale = null;
				inputHandler.clearRect(0, 0, 900, 900);
				Draw();
			},
			POPUP_ADDER = function(_drawer, _clicker, _hover, _right_click){
				if(_drawer==null)
				{
					POPUP_CLOSER();
					POPUP_INDEX = Add(POPUP_TINTER, POPUP_CLOSER, Shape.Box);
				}
				else Add(_drawer, _clicker, _hover, _right_click);
				POPUP_LENGTH++;
			};

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


			/// load saved data
		let _read_game_data,_data_text,_game_imgs,loader_icons;
		function display_server_saved_maps(fnc1, fnc2, fnc3)
		{
			if(fnc1==null)
			{
				fnc1 = function(_load){
					if(!confirm("This will delete the map "+_read_game_data[_load].Name+".\n\nDelete and Replace?"))return;

					local_saved_map = _load;
					POPUP_CLOSER();

					while(name=="" || name==null || name=="Unnamed Custom Map")
						name = prompt("Give your map a name", name);
					if(name==null)
						return;

					send_map_data_to_server(SERVER.DELETE, _read_game_data[_load].id);

					setTimeout(function(){
						send_map_data_to_server(SERVER.SAVE, {
							index:id==-1 ? local_saved_map : id,
							name:name,
							map:encrypt_game_data(Map_Data_To_Str())
						});
					}, 500);
					data_saved = true;
					Draw();
				};
			}
			if(fnc2==null)
			{
				fnc2 = function(_new){
					local_saved_map = _new;
					POPUP_CLOSER();

					while(name=="" || name==null || name=="Unnamed Custom Map")
						name = prompt("Give your map a name", name);
					if(name==null)
						return;

					send_map_data_to_server(SERVER.SAVE, {
						index:id==-1 ? local_saved_map : id,
						name:name,
						map:encrypt_game_data(Map_Data_To_Str())
					});
					data_saved = true;
					Draw();
				};
			}
			_read_game_data = new Array(9);
			_data_text = new Array(9);
			_game_imgs = new Array(9);
			loader_icons = new Array(9);

			POPUP_ADDER();									// declare popup about to be used

			POPUP_ADDER(new Canvas.Drawable(Shape.Rectangle, null, 150, 125, 400, 480, "#777"), function(){});
			POPUP_ADDER(new Canvas.Drawable(Shape.Rectangle, null, 150, 125, 400, 30, "#999"));
			POPUP_ADDER(new Canvas.Drawable(new Text_Class("20pt Verdana", "#fff"), null, 160, 130, 400, 30, "Your Maps"));
			POPUP_ADDER(new Canvas.Drawable(Shape.Rectangle, null, 525, 130, 20, 20, "#F49097"), POPUP_CLOSER);
			POPUP_ADDER(new Canvas.Drawable(new Text_Class("15pt Verdana", "#fff"), null, 527, 132, 20, 18, "X"), POPUP_CLOSER);

			let uploadImg = Images.Retrieve("Uploaded");

			SERVER.onReportGameList(function(_list_data){
					/// start load maps
				for(let _m in _list_data)
				{
					try {
						let curMap = _list_data[_m];
						var index = curMap.saveindex;
						_data_text[index] = decrypt_game_data(curMap.map);
						_read_game_data[index] = Map_Reader.Read(_data_text[index]);
						_read_game_data[index].id = curMap.map_id;
						_read_game_data[index].uploaded = curMap.uploaded;

						if(_read_game_data[index].Valid)
						{
							setTimeout(function(index){
								console.time('drawing map '+index+' sample');
								var sampledGame = new Engine_Class(_read_game_data[index], true);
								sampledGame.Set_Interface(INTERFACE);
								_game_imgs[index] = INTERFACE.Get_Sample(sampledGame);
								sampledGame.End_Game();
								Menu.MapEditor.Draw();
								console.timeEnd('drawing map '+index+' sample');
							}, 50, index);
						}
					} catch (e) {
						_read_game_data[index] = null;
						console.error(e);
					} finally {

					}
				}

				for(var i=0;i<9;i++)
				{
					if(_read_game_data[i]!=null)
					{
						loader_icons[i] = Animations.Retrieve("Load").New(menuCanvas, (230+(110*(i%3)))*Menu.MapEditor.xScale, (215+(140*Math.floor(i/3)))*Menu.MapEditor.yScale, 30*Menu.MapEditor.xScale, 30*Menu.MapEditor.yScale, true);
						POPUP_ADDER(new Canvas.Drawable({
							Draw:function(c,x,y,w,h,_load){
								if(_game_imgs[_load]!=null)
								{
									loader_icons[_load].values.show = false;
									Canvas.ScaleImageData(c, _game_imgs[_load], (x+2)*Menu.MapEditor.xScale, (y+2)*Menu.MapEditor.yScale, w/(_game_imgs[_load].width-4)*Menu.MapEditor.xScale, 100/(_game_imgs[_load].height-4)*Menu.MapEditor.yScale);
								}
								new Text_Class("10pt Verdana", "#fff").Draw(c,x+5,y+h-25,w,h,_read_game_data[_load].Name);

								if(_read_game_data[_load].uploaded)
									uploadImg.Draw(c,x+5,y+5,w/4,h/4);
							}
						}, null, 190+(110*(i%3)), 175+(140*Math.floor(i/3)), 100, 130, i), fnc1, null, fnc3);
						continue;
					}

					// empty new game here

					POPUP_ADDER(new Canvas.Drawable({
						Draw:function(c,x,y,w,h){
							Shape.Rectangle.Draw(c,x+2,y+2,w-4,100-4,"#55D6C2");
							new Text_Class("15pt Verdana", "#fff").Draw(c,x+5,y+h-25,w,h,"new map");
						}
					}, null, 190+(110*(i%3)), 175+(140*Math.floor(i/3)), 100, 130, i), fnc2);
				}
					/// end load map

				for(var x=1;x<Terrain_Data.TERRE.length;x++)
				{
					var _t = Terrain_Data.TERRE[x];

					if(_t.Connnection==5 || _t.Connnection==3)
					{
						Animations.Retrieve(_t.Name+" Ani").Remove_All();
					}
				}
				Select_Animation.Remove_All();
				Repair_Animation.Remove_All();

				Menu.MapEditor.Draw();
			});

			send_map_data_to_server(SERVER.LOAD);

			Draw();
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

		function toSTR(list, _x, _y)
		{
			var str = "",
				i = 0;

			for(var x=0;x<_x;x++)
			{
				for(var y=0;y<_y;y++)
				{
					str+=list[i++]+", ";
				}
				str+="\n";
			}

			return str;
		}
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

		var local_saved_map = 0;
		var id = -1;
		var name;
		var width=10,height=10;
		var x_scale = 600/width;
		var y_scale = 600/height;
		var map_list = null;
		var players;
		var max_players;
		var get_max_players = function()
		{
			return max_players;
		};
		var units;
		var cities;
		var weather = [false];
		let __script__ = "";
		var data_saved = true;
		var beaten_game = false;
		var TYPES = {
			TERRAIN:0,
			UNIT:1,
			CITY:2,
			WEATHER:3,
			ERASE:4
		};

		var ACTIVE_INDEX = 1,								// active list data
			ACTIVE_DRAWABLE = {
				Draw:function(c,x,y,w,h,s){
					var index,
						__type = ACTIVE_TYPE;
					if(__type==TYPES.ERASE)
						__type = OLD_TYPE;
					if(__type==TYPES.TERRAIN)
						index = Terrain_Data.TERRE;
					else if(__type==TYPES.UNIT)
						index = Char_Data.CHARS;
					else if(__type==TYPES.CITY)
						index = Building_Data.PLACE;
					else if(__type==TYPES.WEATHER)
						index = Weather_Data.WEATHER;

					if(index==null)return;

					var img = index[s].Sprite;
					if(__type!=TYPES.CITY)
						img = img[0];
					Shape.Rectangle.Draw(c,x,y,w,h,"#313A35");
					if(img.Image().height>60)
					{
						var xtra_height = (img.Image().height-60)*(40/60);
						img.Draw(c,x,y-xtra_height,w,h+xtra_height);
						return;
					}
					img.Draw(c,x,y,w,h);
					if(index==Terrain_Data.TERRE && s==Terrain_Data.Get("Shore"))
						index[s].Borders[10].Draw(c,x,y,w,h);
				}
			},
			ACTIVE_CLICKABLE = function(_index){
				if(ACTIVE_TYPE==TYPES.ERASE)
				{
					ACTIVE_TYPE = OLD_TYPE;
					ACTIVE_HIGHLIGHT.Alpha.Set(1);
				}
				ACTIVE_INDEX = _index;
				ACTIVE_HIGHLIGHT.State.Set(ACTIVE_INDEX);
				Menu.MapEditor.Mouse_Move(0, 0);
			},
			ACTIVE_PLAYER = 0,
			ACTIVE_TYPE = 0,
			OLD_TYPE = 1;

		var VIEW_ACTIVE_LIST = [-1,0];
		var FIRST_MAP_DRAW = -1,
			MAP_DRAWER = {									// tile display
				Draw:function(c,_x,_y,w,h,s){
					var tile_x = Math.floor(s/height);
					var tile_y = s%height;

					var img = Terrain_Data.TERRE[map_list[s]].Sprite[0];
					if(img.Image().height>60)
					{
						var xtra_height = (img.Image().height-60)*(y_scale/60);
						img.Draw(c,_x,_y-xtra_height,w,h+xtra_height);
						return;
					}
					img.Draw(c,_x,_y,w,h);
					if(map_list[s]==Terrain_Data.Get("Shore"))
						Terrain_Data.TERRE[map_list[s]].Borders[10].Draw(c,_x,_y,w,h);
					for(var j in cities)
					{
						if(cities[j][1]==tile_x && cities[j][2]==tile_y)
						{
							Team_Colors.Draw(c,_x,_y+17,h-17,{
								Color:cities[j][3]+1
							});
							Building_Data.PLACE[cities[j][0]].Sprite.Draw(c,_x+5,_y+5,w-10,h-10);
						}
					}
					for(var j in units)
					{
						if(units[j][1]==tile_x && units[j][2]==tile_y)
						{
							Team_Colors.Draw(c,_x,_y+17,h-17,{
								Color:units[j][3]+1
							});
							Char_Data.CHARS[units[j][0]].Sprite[0].Draw(c,_x+5,_y+5,w-10,h-10);
						}
					}
				}
			},
			MAP_CLICKER = function(tile){					// tile click function
				var _x = Math.floor(tile/height);
				var _y = tile%height;

				if(!Allowed(tile))
				{
					Menu.MapEditor.Mouse_Move(0, 0);
					ERROR_DISPLAY.X.Set(10+(x_scale*_x));
					ERROR_DISPLAY.Y.Set(30+(y_scale*_y));
					ERROR_DISPLAY.Alpha.Set(1);
					Core.Fade_Drawable(ERROR_DISPLAY, 0, 3, function(){
						ERROR_DISPLAY.Alpha.Set(1);
						Core.Fade_Drawable(ERROR_DISPLAY, 0, 7);
					});
					return;
				}

				data_saved = false;
				beaten_game = false;
				Play_Placement_SFX(ACTIVE_TYPE);

				if(ACTIVE_TYPE==TYPES.ERASE)
				{
					for(var i in units)
					{
						if(_x==units[i][1])
						if(_y==units[i][2])
						{
							units.splice(i, 1);
							Menu.MapEditor.Mouse_Move(0, 0);
							Draw();
							return;
						}
					}
					for(var i in cities)
					{
						if(_x==cities[i][1])
						if(_y==cities[i][2])
						{
							cities.splice(i, 1);
							Menu.MapEditor.Mouse_Move(0, 0);
							Draw();
							return;
						}
					}
					if(Terrain_Data.TERRE[map_list[tile]].Type==6)
						map_list[tile] = 12;
					else map_list[tile] = 1;
					Menu.MapEditor.Mouse_Move(0, 0);
					Draw();
					return;
				}

				if(ACTIVE_TYPE==TYPES.TERRAIN)
				{
					map_list[tile] = ACTIVE_INDEX;
					var _ter = Terrain_Data.TERRE[ACTIVE_INDEX];
					for(var j in cities)
					{
						if(cities[j][1]==_x && cities[j][2]==_y)
						{
							var _city = Building_Data.PLACE[cities[j][0]];
							if(_ter.Type==0)
							if(_city.Terrain==2)
							{
								cities.splice(j, 1);
								break;
							}
							if(_ter.Type==6)
							if(_city.Terrain==0)
							{
								cities.splice(j, 1);
								break;
							}
							break;
						}
					}
					for(var j in units)
					{
						if(units[j][1]==_x && units[j][2]==_y)
						{
							var _unit = Char_Data.CHARS[units[j][0]];
							if(_ter.Type==0)
							if(_unit.Move_Type==6 || _unit.Move_Type==7)
							{
								units.splice(j, 1);
								break;
							}
							if(_ter.Type==6)
							if(_unit.Move_Type==0 || _unit.Move_Type==1 || _unit.Move_Type==2)
							{
								units.splice(j, 1);
								break;
							}
							break;
						}
					}

					let _wateramt = 49;
					for(let i=0;i<map_list.length;i++)
					{
						if(map_list[i]>=12)
						{
							_wateramt++;
						}
					}
					if(_wateramt>=width*height/2)
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
				else if(ACTIVE_TYPE==TYPES.UNIT)
				{
					var found = false;
					for(var j in units)
					{
						if(units[j][1]==_x && units[j][2]==_y)
						{
							units[j][0] = ACTIVE_INDEX;
							units[j][3] = ACTIVE_PLAYER;
							found = true;
							break;
						}
					}
					if(!found)
					{
						units.push([ACTIVE_INDEX, _x, _y, ACTIVE_PLAYER]);
					}
				}
				else if(ACTIVE_TYPE==TYPES.CITY)
				{
					var found = false;
					for(var j in cities)
					{
						if(cities[j][1]==_x && cities[j][2]==_y)
						{
							cities[j][0] = ACTIVE_INDEX;
							cities[j][3] = ACTIVE_PLAYER;
							found = true;
							break;
						}
					}
					if(!found)
					{
						cities.push([ACTIVE_INDEX, _x, _y, ACTIVE_PLAYER]);
					}
				}
				else if(ACTIVE_TYPE==TYPES.WEATHER)
				{
					LOG.add("weather not implemented");
					// map_list[tile] = ACTIVE_INDEX;
				}
				Menu.MapEditor.Mouse_Move(0, 0);
				Draw();
			};

		Add(new Canvas.Drawable(Images.Retrieve("map editor border"), null, 0, 0, 805, 660)); // border img
		Add(new Canvas.Drawable(Shape.Box, null, 9, 29, 602, 602, "#F2EFDE", null, 1));			// map border

		Add(new Canvas.Drawable(Shape.Rectangle, null, 611, 29, 3, 602, "#BFACAA", null, 1));	// divider
		Add(new Canvas.Drawable(Shape.Box, null, 615, 29, 165, 602, "#F2EFDE", null, 1));		// tools border
		Add(new Canvas.Drawable(Shape.Rectangle, null, 616, 30, 163, 600, "#313A35", null, 1));	// tools background
		Add(new Canvas.Drawable(Shape.Rectangle, null, 616, 181, 163, 3, "#F2EFDE", null, 1));	// divider
		Add(new Canvas.Drawable(Shape.Rectangle, null, 616, 541, 163, 3, "#F2EFDE", null, 1));	// divider

			// bottom buttons
		Add(new Canvas.Drawable({							// test btn
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[0]);
				new Text_Class(""+(h/2)+"pt Verdana", Menu.Button[2]).Draw(c,x+6,y+8,260,20,s);
				new Text_Class(""+(h/2)+"pt Verdana", Menu.Button[3]).Draw(c,x+5,y+7,260,20,s);
			}
		}, null, 700, 550, 70, 35, "TEST"), function(){
			var each_player = new Array(max_players);
			for(var i=0;i<each_player.length;i++)
				each_player[i] = false;
			for(var i in units)
				each_player[units[i][3]] = true;
			for(var i in each_player)
			{
				if(!each_player[i])
				{
					LOG.add("Each player must have at least one unit to Test.", "#f00",3000);
					return;
				}
			}
			// all players have to have at least one unit to play

			if(local_saved_map==-1)
			{	// ask to save, because user created a map before saving
				display_server_saved_maps();
				return;
			}

			new_custom_game(Map_Data_To_Str(), name, true, local_saved_map, 1);
		}, {
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[1]);
				new Text_Class(""+(h/2)+"pt Verdana", Menu.Button[2]).Draw(c,x+6,y+8,260,20,s);
				new Text_Class(""+(h/2)+"pt Verdana", Menu.Button[3]).Draw(c,x+5,y+7,260,20,s);
			}
		});
		Add(new Canvas.Drawable({							// upload btn
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[(beaten_game && data_saved) ? 0:4]);
				new Text_Class(""+(h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x+8,y+9,260,20,s);
				new Text_Class(""+(h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x+7,y+8,260,20,s);
			}
		}, null, 700, 590, 70, 30, "UPLOAD"), function(){
			if(!beaten_game)return;
			if(!data_saved)return;

			var color = "#fff";
			send_map_data_to_server(SERVER.PUBLISH, id);
			alert("Successfully uploaded.");
		}, {
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[(beaten_game && data_saved) ? 1:4]);
				new Text_Class(""+(h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x+8,y+9,260,20,s);
				new Text_Class(""+(h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x+7,y+8,260,20,s);
			}
		});
		Add(new Canvas.Drawable({							// save btn
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[(!data_saved) ? 5:4]);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[(!data_saved) ? 5 : 2]).Draw(c,x+12,y+5,260,20,s);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[(!data_saved) ? 6 : 3]).Draw(c,x+11,y+3,260,20,s);
			}
		}, null, 625, 550, 70, 20, "SAVE"), function(){
			if(data_saved)return;

			if(local_saved_map==-1)
			{	// ask to save, because user created a map before saving
				display_server_saved_maps();
				return;
			}

			while(name=="" || name==null || name=="Unnamed Custom Map" || name.includes(";"))
				name = prompt("Give your map a name", name);
			if(name==null)
				return;

			send_map_data_to_server(SERVER.SAVE, {
				index:id==-1 ? local_saved_map : id,
				name:name,
				map:encrypt_game_data(Map_Data_To_Str())
			});
			data_saved = true;
			Draw();
		}, {
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[(!data_saved) ? 1:4]);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x+12,y+5,260,20,s);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x+11,y+3,260,20,s);
			}
		});
		Add(new Canvas.Drawable({							// load maps btn
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[0]);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x+12,y+5,260,20,s);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x+11,y+3,260,20,s);
			}
		}, null, 625, 575, 70, 20, "LOAD"),
		function(){
			display_server_saved_maps(function(_load){
				Erase();
				Open();
				Menu.MapEditor.New(_load, _read_game_data[_load]);
				Draw();
			}, function(_new){
				Erase();
				Open();
				Menu.MapEditor.New(_new);
				Draw();
			}, function(_delete){
					if(!confirm("Do you really want to delete "+_read_game_data[_delete].Name+"?"))return;

					send_map_data_to_server(SERVER.DELETE, _read_game_data[_delete].id);

					POPUP_CLOSER();
					Draw();
				});
		}, {
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[1]);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x+12,y+5,260,20,s);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x+11,y+3,260,20,s);
			}
		});
		Add(new Canvas.Drawable({							// exit btn
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[0]);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x+17,y+3,260,20,s);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x+15,y+2,260,20,s);
			}
		}, null, 625, 600, 70, 20, "EXIT"), function(){
			mainMenu();
			Menu.MapEditor.Erase();
		}, {
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[1]);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x+17,y+3,260,20,s);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x+15,y+2,260,20,s);
			}
		});

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

		var ERROR_DISPLAY = new Canvas.Drawable({
			Draw:function(c,x,y,w,h,s){
				Shape.Rectangle.Draw(c,x,y,w,h,"#F00");
			}
		}, null, -100, -100, 10, 10);
		Allowed = function(_tile)
		{
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

		var ACTIVE_HIGHLIGHT = new Canvas.Drawable({
			Draw:function(c,x,y,w,h,s){
				if(VIEW_ACTIVE_LIST[1]==14)
					s = s%14;
				else s = s%13;
				Shape.Box.Draw(c,x+(80*Math.floor(--s/7)),y+(50*(s%7)),w,h,Menu.Button[3]);
			}
		}, null, 623, 191, 45, 45, 1);
		ACTIVE_HIGHLIGHT.Index = Menu.MapEditor;
		Add(ACTIVE_HIGHLIGHT);

		Update_Active_List = function(__type, page)
		{													// this changes the active choice
			var index;
			if(__type==TYPES.ERASE)
				__type = OLD_TYPE;
			if(__type==TYPES.TERRAIN)
				index = Terrain_Data.TERRE;
			else if(__type==TYPES.UNIT)
				index = Char_Data.CHARS;
			else if(__type==TYPES.CITY)
				index = Building_Data.PLACE;
			else if(__type==TYPES.WEATHER)
				index = Weather_Data.WEATHER;
			if(index==null)return;
			if(page==null)page = 0;

			if(ACTIVE_INDEX>index.length-1)
			{	// puts data at max, if its over limit
				ACTIVE_INDEX = index.length-1;
				ACTIVE_HIGHLIGHT.State.Set(ACTIVE_INDEX);
			}

			if(VIEW_ACTIVE_LIST[0]<FIRST_MAP_DRAW)
				FIRST_MAP_DRAW-=VIEW_ACTIVE_LIST[1];

			Remove(VIEW_ACTIVE_LIST[0], VIEW_ACTIVE_LIST[1]);

			VIEW_ACTIVE_LIST = [-1,0];
			ACTIVE_TYPE = __type;

			var data_loc = 0;
			for(var i=0;page*13+i<index.length-1 && i<13;i++)
			{
				VIEW_ACTIVE_LIST[1]++;
				data_loc = Add(new Canvas.Drawable(ACTIVE_DRAWABLE, null,
						625+(80*Math.floor(i/7)), 193+(50*(i%7)),
						40, 40, page*13+i+1),
					ACTIVE_CLICKABLE, new Canvas.Drawable(Shape.Rectangle, null,
						625+(80*Math.floor(i/7)), 193+(50*(i%7)), 40, 40,
						"#666607", null, .4));
				if(i==0)VIEW_ACTIVE_LIST[0] = data_loc;
			}
			if(page*13+15==index.length)
			{
				VIEW_ACTIVE_LIST[1]++;
				Add(new Canvas.Drawable({
					Draw:function(c,x,y,w,h,s){
						var img = index[s].Sprite;
						if(ACTIVE_TYPE!=TYPES.CITY)
							img = img[0];
						Shape.Rectangle.Draw(c,x,y,w,h,"#313A35");
						if(img.Image().height>60)
						{
							var xtra_height = (img.Image().height-60)*(40/60);
							img.Draw(c,x,y-xtra_height,w,h+xtra_height);
							return;
						}
						img.Draw(c,x,y,w,h);
					}
				}, null, 705, 493, 40, 40, page*13+14), function(_index){
					if(ACTIVE_TYPE==TYPES.ERASE)
					{
						ACTIVE_TYPE = OLD_TYPE;
						ACTIVE_HIGHLIGHT.Alpha.Set(1);
					}
					ACTIVE_INDEX = _index;
					ACTIVE_HIGHLIGHT.State.Set(ACTIVE_INDEX);
				}, new Canvas.Drawable(Shape.Rectangle, null, 625+(80*Math.floor(i/7)), 193+(50*(i%7)), 40, 40, "#666607", null, .4));
			}
			else if(index.length>13)
			{
				if(page!=0)
				{
					VIEW_ACTIVE_LIST[1]++;
					Add(new Canvas.Drawable({		// left
						Draw:function(c, x, y, w, h, s){
							Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[0]);
							new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+3,260,20,s);
							new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+2,260,20,s);
						}
					}, null, 705, 495, 18, 30, "<"), function(){
						Update_Active_List(__type, page-1);
					}, {
						Draw:function(c, x, y, w, h, s){
							Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[1]);
							new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+3,260,20,s);
							new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+2,260,20,s);
						}
					});
				}
				if(page*13+14<index.length)
				{
					VIEW_ACTIVE_LIST[1]++;
					Add(new Canvas.Drawable({		// left
						Draw:function(c, x, y, w, h, s){
							Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[0]);
							new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+3,260,20,s);
							new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+2,260,20,s);
						}
					}, null, 728, 495, 18, 30, ">"), function(){
						Update_Active_List(__type, page+1);
					}, {
						Draw:function(c, x, y, w, h, s){
							Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[1]);
							new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x,y+3,260,20,s);
							new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x,y+2,260,20,s);
						}
					});
				}
			}
			Draw();
		};

		Add(new Canvas.Drawable({							// TERRAIN btn
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[(ACTIVE_TYPE==TYPES.TERRAIN) ? 5 : 0]);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[(ACTIVE_TYPE==TYPES.TERRAIN) ? 5 : 2]).Draw(c,x+8,y+4,260,20,s);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[(ACTIVE_TYPE==TYPES.TERRAIN) ? 6 : 3]).Draw(c,x+6,y+3,260,20,s);
			}
		}, null, 625, 35, 70, 20, "Terrain"), function(){
			Update_Active_List(TYPES.TERRAIN);
			ACTIVE_HIGHLIGHT.Alpha.Set(1);
			Menu.MapEditor.Mouse_Move(0, 0);
		}, {
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[1]);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x+8,y+4,260,20,s);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x+6,y+3,260,20,s);
			}
		});
		Add(new Canvas.Drawable({							// UNIT btn
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[(ACTIVE_TYPE==TYPES.UNIT) ? 5 : 0]);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[(ACTIVE_TYPE==TYPES.UNIT) ? 5 : 2]).Draw(c,x+15,y+4,260,20,s);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[(ACTIVE_TYPE==TYPES.UNIT) ? 6 : 3]).Draw(c,x+14,y+3,260,20,s);
			}
		}, null, 625, 60, 70, 20, "Units"), function(){
			Update_Active_List(TYPES.UNIT);
			ACTIVE_HIGHLIGHT.Alpha.Set(1);
			Menu.MapEditor.Mouse_Move(0, 0);
		}, {
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[1]);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x+15,y+4,260,20,s);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x+14,y+3,260,20,s);
			}
		});
		Add(new Canvas.Drawable({							// CITY btn
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[(ACTIVE_TYPE==TYPES.CITY) ? 5 : 0]);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[(ACTIVE_TYPE==TYPES.CITY) ? 5 : 2]).Draw(c,x+14,y+4,260,20,s);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[(ACTIVE_TYPE==TYPES.CITY) ? 6 : 3]).Draw(c,x+13,y+3,260,20,s);
			}
		}, null, 700, 35, 70, 20, "Cities"), function(){
			Update_Active_List(TYPES.CITY);
			ACTIVE_HIGHLIGHT.Alpha.Set(1);
			Menu.MapEditor.Mouse_Move(0, 0);
		}, {
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[1]);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x+14,y+4,260,20,s);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x+13,y+3,260,20,s);
			}
		});
		Add(new Canvas.Drawable({							// WEATHER btn
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[(ACTIVE_TYPE==TYPES.WEATHER) ? 5 : 0]);
				new Text_Class(""+(3*h/5)+"pt Verdana", Menu.Button[(ACTIVE_TYPE==TYPES.WEATHER) ? 5 : 2]).Draw(c,x+2,y+4,260,20,s);
				new Text_Class(""+(3*h/5)+"pt Verdana", Menu.Button[(ACTIVE_TYPE==TYPES.WEATHER) ? 6 : 3]).Draw(c,x+1,y+3,260,20,s);
			}
		}, null, 700, 60, 70, 20, "Weather"), function(){
			Update_Active_List(TYPES.WEATHER);
			ACTIVE_HIGHLIGHT.Alpha.Set(1);
			Menu.MapEditor.Mouse_Move(0, 0);
		}, {
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[1]);
				new Text_Class(""+(3*h/5)+"pt Verdana", Menu.Button[2]).Draw(c,x+2,y+4,260,20,s);
				new Text_Class(""+(3*h/5)+"pt Verdana", Menu.Button[3]).Draw(c,x+1,y+3,260,20,s);
			}
		});
		Add(new Canvas.Drawable({							// ERASE btn
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[(ACTIVE_TYPE==TYPES.ERASE) ? 5 : 0]);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[(ACTIVE_TYPE==TYPES.ERASE) ? 5 : 2]).Draw(c,x+7,y+5,260,20,s);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[(ACTIVE_TYPE==TYPES.ERASE) ? 6 : 3]).Draw(c,x+6,y+4,260,20,s);
			}
		}, null, 625, 100, 70, 25, "Erase"), function(){
			OLD_TYPE = ACTIVE_TYPE;
			ACTIVE_TYPE = TYPES.ERASE;
			ACTIVE_HIGHLIGHT.Alpha.Set(0);
			Menu.MapEditor.Mouse_Move(0, 0);
		}, {
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[1]);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x+7,y+5,260,20,s);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x+6,y+4,260,20,s);
			}
		});
		Add(new Canvas.Drawable({							// MAP btn
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[0]);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x+12,y+5,260,20,s);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x+11,y+3,260,20,s);
			}
		}, null,700, 100, 70, 25, "MAP"), MAP_OPTION_ADDER, {							// MAP icon
			Draw:function(c, x, y, w, h, s){
				Shape.Rectangle.Draw(c,x,y,w,h,Menu.Button[1]);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[2]).Draw(c,x+12,y+5,260,20,s);
				new Text_Class(""+(2*h/3)+"pt Verdana", Menu.Button[3]).Draw(c,x+11,y+3,260,20,s);
			}
		});

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

/*** Level Select Screen ***/
Menu.Game_Prompt = new Menu.Menu_Class();


/*** Level Select Screen ***/
Menu.LevelSelect = new Menu.Menu_Class("#77a8bc");
with(Menu.LevelSelect){
	Add(new Canvas.Drawable(new Text_Class("32pt Impact", "#A349A4"), null, 30, 10, 600, 45, "Level Select"));
	Add(new Canvas.Drawable(new Text_Class("18pt Impact", "#642D64"), null, 50, 65, 600, 45, "Free Maps"));
	Add(new Canvas.Drawable(new Text_Class("18pt Impact", "#642D64"), null, 50, 270, 600, 45, "Recently Uploaded Maps"));
	Add(new Canvas.Drawable(Shape.Rectangle, null, 20, 260, 230, 3, "#000000", null, .6));
	Add(new Canvas.Drawable(new Text_Class("18pt Impact", "#642D64"), null, 50, 470, 600, 45, "Search maps by..."));
	let USER_SEARCH = 0,
		SEARCH_TEXT = "Username";
	Add(new Canvas.Drawable(new Text_Class("15pt Impact", "#000", {underline:true}), null, 320, 467, 100, 20, function() {
		return SEARCH_TEXT+":";
	}), function(){
		USER_SEARCH = (USER_SEARCH+1)%3;
		switch (USER_SEARCH) {
			case 0:
				SEARCH_TEXT = "User";
				break;
			case 1:
				SEARCH_TEXT = "Map ID";
				break;
			case 2:
				SEARCH_TEXT = "Map Name";
				break;
			default:
				SEARCH_TEXT = "Nothing";
		}
		Draw();
	}, new Canvas.Drawable({
		Draw:function(c,x,y,w,h,s)
		{
			Shape.Rectangle.Draw(c,x,y,w,h,"#77a8bc");
			s.Draw(c,x,y,w,h,SEARCH_TEXT+":");
		}
	}, null, 320, 467, 100, 20, new Text_Class("15pt Impact", "#00f", {underline:true})));
	Add(new Canvas.Drawable(Shape.Rectangle, null, 20, 460, 230, 3, "#000000", null, .6));
	Add(new Canvas.Drawable({ // back btn
		Draw:function(c, x, y, w, h, s){
			Shape.Rectangle.Draw(c,x,y,310,75,Menu.Button[0]);
			new Text_Class("36pt Verdana", Menu.Button[2]).Draw(c,x+90,y+20,260,55,"BACK");
			new Text_Class("36pt Verdana", Menu.Button[3]).Draw(c,x+87,y+17,260,55,"BACK");
		}
	}, null, 430, 10, 310, 75), function(){
		Animations.Retrieve("Load").Remove_All();
		mainMenu();
	}, {
		Draw:function(c, x, y, w, h, s){
			Shape.Rectangle.Draw(c,x,y,310,75,Menu.Button[1]);
			new Text_Class("36pt Verdana", Menu.Button[2]).Draw(c,x+90,y+20,260,55,"BACK");
			new Text_Class("36pt Verdana", Menu.Button[3]).Draw(c,x+87,y+17,260,55,"BACK");
		}
	});

	let setScroller;
	Menu.LevelSelect.Set_Scroller = function(scrollerFnc)
	{
		setScroller = scrollerFnc;
	};
	Menu.LevelSelect.Activate = function()
	{
		let search = new CanvasTextEditor(new Document("Enter here..."), {width:175, height:18, left:420, top:460});

	  // document.getElementById('inputHandler').appendChild(editor.getEl());
		// editor.getEl().id = "LevelSelectNameSearch";
	  document.getElementById('inputHandler').appendChild(search.getEl());
		search.getEl().id = "LevelSelectSearch";

		Menu.LevelSelect.Current_Scale = function(x, y)
		{
			search.reflow(x, y);
		};
		Menu.LevelSelect.Current_Scale(Menu.LevelSelect.xScale, Menu.LevelSelect.yScale);

		let last_q;
		let search_fnc = function()
		{
			Menu.LevelSelect.Prep(2);

			let query = "";
			for(let i=0;i<search._document.storage.length-1;i++)
			{
				query+=search._document.storage[i].substring(0, search._document.storage[i].length-1);
			}
			query+=search._document.storage[search._document.storage.length-1];
			search._document = new Document(query);

			if(query==last_q)
				return;
			if(query.length==0)
				return;
			if(query.includes("'") || query.includes('"'))
				return;
			if(query.includes(".") || query.includes(';'))
				return;

			last_q = query;
			let QUERY = {};
			switch (USER_SEARCH) {
				case 0:
					QUERY.mapowner = query;
					break;
				case 1:
					QUERY.Map_Id = query;
					break;
				case 2:
					QUERY.mapname = query;
					break;
				default:
					return;
			}

			socket.emit('gamedata get', QUERY, 0, 5);
			search.render();
		};

		search.inputEl.onkeydown = function(e)
		{
			if(e.keyCode==13)
			{
				search_fnc();
			}
		};
		search.inputEl.onblur = search_fnc;
		search.inputEl.onfocus = function(e)
		{
			if(window.parent.mobilecheck())
			{
				let _q = prompt("Please enter yor search");
				search._document = new Document(_q);
				search_fnc();
				return;
			}
			if(search._document.storage[0]=="Enter here...")
				search._document = new Document("");
		};

		let old_closer = Menu.LevelSelect.Close;
		Menu.LevelSelect.Close = function()
		{
			try {
				// document.getElementById('inputHandler').removeChild(document.getElementById('LevelSelectNameSearch'));
				document.getElementById('inputHandler').removeChild(document.getElementById('LevelSelectSearch'));
			} catch (e) {

			} finally {

			}
			old_closer();
		};
	};

	let Caption = new Text_Class("15pt Impact", "#D7EFD0");
	let Owner = new Text_Class("9pt Impact", "#C2D8BC");

	let section_index = 0;
	let remove_index = new Array(3);
	let _width = window.parent.mobilecheck() ? 125 : 125;
	Menu.LevelSelect.Prep = function(input)
	{
		switch (input){
			case 0:
				section_index = 0;
				break;
			case 1:
				section_index = 1;
				break;
			case 2:
				section_index = 2;
				break;
		}
	};
	Menu.LevelSelect.Update_Map_Search = function(_data_text)
	{	// data, y row index
		if(!setScroller)return;
		var _read_game_data = new Array(_data_text.length),
		_game_imgs = new Array(_data_text.length),
		names = new Array(_data_text.length),
		loaders = new Array(_data_text.length);
		let y_loc = section_index*200;
		if(remove_index[section_index]!=null)
		{
			Menu.LevelSelect.Remove(remove_index[section_index], _data_text.length);
			remove_index[section_index] = null;
		}

			/// start load maps
		for(let index in _data_text)
		{
			names[index] = _data_text[index].name;
			_data_text[index] = decrypt_game_data(_data_text[index].game);
			_read_game_data[index] = Map_Reader.Read(_data_text[index]);

			if(_read_game_data[index].Valid)
			{
				setTimeout(function(index){
					var sampledGame = new Engine_Class(_read_game_data[index], true);
					sampledGame.Set_Interface(INTERFACE);
					sampledGame.FORCE_MERGE_DISPLAY = true;
					_game_imgs[index] = INTERFACE.Get_Sample(sampledGame);
					sampledGame.End_Game();
					imageHolderCanvas.clearRect(0, 0, 900, 900);
					worldCanvas.clearRect(0, 0, 900, 900);
					setTimeout(function(){
						if(INTERFACE.Open_Menu()==Menu.LevelSelect)
							Menu.LevelSelect.Draw();
					}, 20);
				}, 50, index);
			}
		}

		let drawer = { // level display
			Draw:function(c,x,y,w,h,_load){
				if(_game_imgs[_load]==null)
				{
					loaders[_load].values.show = true;
				}
				else
				{
					loaders[_load].values.show = false;
					Canvas.ScaleImageData(c, _game_imgs[_load], x*Menu.LevelSelect.xScale, y*Menu.LevelSelect.yScale, w/_game_imgs[_load].width*Menu.LevelSelect.xScale, h/_game_imgs[_load].height*Menu.LevelSelect.yScale);
				}
				c.globalAlpha = .2;
				Shape.Rectangle.Draw(c,x,y,w,h,"#E5D1D0");
				c.globalAlpha = .7;
				Shape.Rectangle.Draw(c,x,y+120,w,30,"#57634E");
				Shape.Rectangle.Draw(c,x,y+120,w,1,"#F4EFEB");
				c.globalAlpha = 1;
				Shape.Box.Draw(c,x,y,w,h,"#73877B");
				Caption.Draw(c,x+5,y+123,w,25,_read_game_data[_load].Name);
				Owner.Draw(c,x+5,y+140,w,10,names[_load]);
			}
		};
		let clicker = function(level){
			var gameName = "";
			while(gameName=="")gameName = prompt("Name the game ");
			if(!gameName)return;
			Animations.Retrieve("Load").Remove_All();
			new_custom_game(_read_game_data[level], gameName);
		};
		for(var i=0;i<_data_text.length;i++){
			loaders[i] = Animations.Retrieve("Load").New(menuCanvas, 30+((_width+10+(_width/3))*(_data_text.length-i-1)), (150+y_loc)*Menu.LevelSelect.yScale, _width/3*Menu.LevelSelect.xScale, 50*Menu.LevelSelect.yScale, (y_loc!=0));
			let _index = Add(new Canvas.Drawable(drawer, null, 30+((_width+10)*(_data_text.length-i-1)), 100+y_loc, _width, 150, i), clicker, new Canvas.Drawable(Shape.Box, null, 30+((_width+10)*(_data_text.length-i-1)), 100+y_loc, _width, 150, "#F2F5FF", null, .5));
			if(i==0)
				remove_index[section_index] = _index;
		}
		if(INTERFACE.Open_Menu()==Menu.LevelSelect)
			Draw();

		// setScroller();
	};
}

/*** Main Story / Tutorial Screen ***/
Menu.StoryScreen = new Menu.Menu_Class("#77a8bc");
with(Menu.StoryScreen){
	Add(new Canvas.Drawable(new Text_Class("32pt Impact", "#A349A4"), null, 30, 10, 600, 45, "Story Mode"));
	Add(new Canvas.Drawable(new Text_Class("18pt Impact", "#642D64"), null, 50, 65, 600, 45, "Battle of Torrial"));
	Add(new Canvas.Drawable(new Text_Class("18pt Impact", "#642D64"), null, 50, 270, 600, 45, "Ancient Europe"));
	Add(new Canvas.Drawable(Shape.Rectangle, null, 20, 260, 230, 3, "#000000", null, .6));
	Add(new Canvas.Drawable(new Text_Class("18pt Impact", "#642D64"), null, 50, 470, 600, 45, "Han Dynasty"));

	Add(new Canvas.Drawable(Shape.Rectangle, null, 20, 460, 230, 3, "#000000", null, .6));
	Add(new Canvas.Drawable({ // back btn
		Draw:function(c, x, y, w, h, s){
			Shape.Rectangle.Draw(c,x,y,310,75,Menu.Button[0]);
			new Text_Class("36pt Verdana", Menu.Button[2]).Draw(c,x+90,y+20,260,55,"BACK");
			new Text_Class("36pt Verdana", Menu.Button[3]).Draw(c,x+87,y+17,260,55,"BACK");
		}
	}, null, 430, 10, 310, 75), function(){
		Animations.Retrieve("Load").Remove_All();
		mainMenu();
	}, {
		Draw:function(c, x, y, w, h, s){
			Shape.Rectangle.Draw(c,x,y,310,75,Menu.Button[1]);
			new Text_Class("36pt Verdana", Menu.Button[2]).Draw(c,x+90,y+20,260,55,"BACK");
			new Text_Class("36pt Verdana", Menu.Button[3]).Draw(c,x+87,y+17,260,55,"BACK");
		}
	});

	let Caption = new Text_Class("15pt Impact", "#D7EFD0");
	let Owner = new Text_Class("9pt Impact", "#C2D8BC");

	let remove_index = new Array(3);
	let _width = window.parent.mobilecheck() ? 125 : 125;
	let loaded_ = false;
	let section_index = 0;

	Menu.StoryScreen.Prep = function(input)
	{
		if(input<0 || input>=Levels.Current().length)return;
		loaded_ = false;
		section_index = input;
	};
	Menu.StoryScreen.Load = function()
	{	// data, y row index
		if(loaded_)return;
		let __unlocked_data = Levels.Current();
		let __unlocked = __unlocked_data[section_index];
		let __section = section_index;

		let _read_game_data = new Array(__unlocked),
		_game_imgs = new Array(__unlocked),
		names = new Array(__unlocked),
		loaders = new Array(__unlocked);
		let y_loc = section_index*200;
		if(remove_index[section_index]!=null)
		{
			Menu.StoryScreen.Remove(remove_index[section_index], __unlocked);
			remove_index[section_index] = null;
		}

			/// start load maps
		for(let index=0;index<__unlocked;index++)
		{
			let _data_text = Levels.Data(section_index, index);

			names[index] = Levels.Name(index);
			_data_text = decrypt_game_data(_data_text);
			_read_game_data[index] = Map_Reader.Read(_data_text);

			if(_read_game_data[index].Valid)
			{
				setTimeout(function(index){
					var sampledGame = new Engine_Class(_read_game_data[index], true);
					sampledGame.Set_Interface(INTERFACE);
					sampledGame.FORCE_MERGE_DISPLAY = true;
					_game_imgs[index] = INTERFACE.Get_Sample(sampledGame);
					sampledGame.End_Game();
					imageHolderCanvas.clearRect(0, 0, 900, 900);
					worldCanvas.clearRect(0, 0, 900, 900);
					setTimeout(function(){
						if(INTERFACE.Open_Menu()==Menu.StoryScreen)
							Menu.StoryScreen.Draw();
					}, 20);
				}, 50, index);
			}
		}

		let drawer = { // level display
			Draw:function(c,x,y,w,h,_load){
				if(_game_imgs[_load]==null)
				{
					loaders[_load].values.show = true;
				}
				else
				{
					loaders[_load].values.show = false;
					Canvas.ScaleImageData(c, _game_imgs[_load], x*Menu.StoryScreen.xScale, y*Menu.StoryScreen.yScale, w/_game_imgs[_load].width*Menu.StoryScreen.xScale, h/_game_imgs[_load].height*Menu.StoryScreen.yScale);
				}
				c.globalAlpha = .2;
				Shape.Rectangle.Draw(c,x,y,w,h,"#E5D1D0");
				c.globalAlpha = .7;
				Shape.Rectangle.Draw(c,x,y+120,w,30,"#57634E");
				Shape.Rectangle.Draw(c,x,y+120,w,1,"#F4EFEB");
				c.globalAlpha = 1;
				Shape.Box.Draw(c,x,y,w,h,"#73877B");
				Caption.Draw(c,x+5,y+123,w,25,_read_game_data[_load].Name);
				Owner.Draw(c,x+5,y+140,w,10,names[_load]);
			}
		};
		let clicker = function(level){
			Animations.Retrieve("Load").Remove_All();
			new_custom_game(_read_game_data[level], Levels.Name(level), true, null, __unlocked==level+1 ? 2 : 3, __section);
		};
		for(var j=0;j<3;j++)
		for(var i=0;i<5;i++){
			loaders[i] = Animations.Retrieve("Load").New(menuCanvas, 30+((_width+10+(_width/3))*(i)), (150+y_loc)*Menu.StoryScreen.yScale, _width/3*Menu.StoryScreen.xScale, 50*Menu.StoryScreen.yScale, (y_loc!=0));
			let _index = Add(new Canvas.Drawable(drawer, null, 30+((_width+10)*(i)), 100+y_loc, _width, 150, i), clicker, new Canvas.Drawable(Shape.Box, null, 30+((_width+10)*(i)), 100+y_loc, _width, 150, "#F2F5FF", null, .5));
			if(i==0)
				remove_index[section_index] = _index;
		}
		loaded_ = true;
	};
}


/*** Before Game Lobby Menu ***/
Menu.PreGame = new Menu.Menu_Class("#77a8bc");
Menu.PreGame.Slots = [];
Menu.PreGame.Icon = {
	Image:null,
	Draw:function(canvas, x, y, w, h){
		if(this.Image==null)return;
		Canvas.ScaleImageData(canvas, this.Image, x*Menu.PreGame.xScale, y*Menu.PreGame.yScale, w/this.Image.width*Menu.PreGame.xScale, h/this.Image.height*Menu.PreGame.yScale);
	}
};
Menu.PreGame.Set = function(index,value){
	if(index>=this.Slots.length)return;
	this.Slots[index].State.Set(value);
};
Menu.PreGame.visibleMapID = function(txt){
	if(txt==null)return "";
	if(txt.length!=9)return "";
	return txt.substring(0, 3) + " - " + txt.substring(3, 6) + " - " + txt.substring(6, 9);
};
Menu.PreGame.Map = function(map, gameImage){
	if(map==null || gameImage==null)return;

	let playersAmount, __name, __id;

	if(!map.Valid)return;
	playersAmount = map.Player_Amount();
	__name = map.Name;
	__id = map.id;

	this.Erase();
	this.Add(new Canvas.Drawable(new Text_Class("45pt Impact", "#000"), null, 50, 70, 600, 45, __name));
	this.Add(new Canvas.Drawable(new Text_Class("20pt Impact", "#000"), null, 140, 14, 300, 30, "Map ID: "+Menu.PreGame.visibleMapID(__id)));
	this.Add(new Canvas.Drawable({ // back btn
		Draw:function(c, x, y, w, h, s){
			Shape.Rectangle.Draw(c,x,y,85,35,Menu.Button[0]);
			new Text_Class("15pt Verdana", Menu.Button[2]).Draw(c,x+15,y+10,60,25,"BACK");
			new Text_Class("15pt Verdana", Menu.Button[3]).Draw(c,x+13,y+8,60,25,"BACK");
		}
	}, null, 20, 10, 85, 35), function(){
		INTERFACE.Game.Send_Move('leave');
		mainMenu();
	}, {
		Draw:function(c, x, y, w, h, s){
			Shape.Rectangle.Draw(c,x,y,85,35,Menu.Button[1]);
			new Text_Class("15pt Verdana", Menu.Button[2]).Draw(c,x+15,y+10,60,25,"BACK");
			new Text_Class("15pt Verdana", Menu.Button[3]).Draw(c,x+13,y+8,60,25,"BACK");
		}
	});

	var NameTxt = new Text_Class("40pt Calibri", "#000");
	this.Slots = [];
	this.Add(new Canvas.Drawable(Shape.Rectangle, null, 20, 150, 400, (playersAmount*52)-2, "#F2F3FF"));
	for(var i=0;i<playersAmount;i++){
		this.Slots[i] = new Canvas.Drawable(NameTxt, null, 40, 150+52*i, 400, 48, "");
		this.Slots[i].Index = Menu.PreGame;
		this.Add(this.Slots[i]);
		if(i!=0)this.Add(new Canvas.Drawable(Shape.Rectangle, null, 35, 148+52*i, 370, 2, "#000"));
	}
	this.Icon.Image = gameImage;
	this.Add(new Canvas.Drawable(this.Icon, null, 450, 150, 300, 300, map));
};
Menu.PreGame.AddStarter = function(){
	this.Add(new Canvas.Drawable({ // default display
		Draw:function(c, x, y, w, h, s){
			Shape.Rectangle.Draw(c,x,y,w,h,"#A77CC3");
			new Text_Class("45pt Impact", "#7ECC9E").Draw(c,x+25,y+30,w,h,function(){
				if(INTERFACE.Game.Full())
					return " Start Game";
				return "Start with AI";
			});
		}
	}, null, 400, 40, 350, 100), function(){ // click function
		INTERFACE.Game.Host_Game(socket.game_id);
	}, { // hovered display
		Draw:function(c, x, y, w, h, s){
			Shape.Rectangle.Draw(c,x,y,w,h,"#63FF97");
			new Text_Class("45pt Impact", "#848DC6").Draw(c,x+25,y+30,w,h,function(){
				if(INTERFACE.Game.Full())
					return " Start Game";
				return "Start with AI";
			});
		}
	});
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
