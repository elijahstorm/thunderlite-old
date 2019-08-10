/*** This reads custom map data, and makes it playable */

var Map_Reader_Class = function(){
	var Map_Data = function(__t_data, __name, __id, __source)
	{	/// requires terrain data input, or valid is always false
		this.Name = __name;
		this.Valid = false;
		this.id = __id;
		this.Source = __source;

		if(__t_data.length<10)
		{
			return;
		}
		if(__t_data[0].length<10)
		{
			return;
		}

		var players = [],
			terrain_data = __t_data,
			units = [],
			cities = [],
			weather = [false],
			script = "";

		this.Data = {
			Get:function(){
				return {
					source:__source,
					id:__id,
					name:__name,
					t_width:__t_data.length,
					t_height:__t_data[0].length,
					terrain:__t_data,
					p_list:players,
					u_list:units,
					c_list:cities,
					w_data:weather,
					__script:script
				};
			}
		};

		this.Player_Amount = function()
		{
			return players.length;
		};

		this.Add_Player = function(__player)
		{
			if(players.length>=8)return;
			players.push(__player);
			if(players.length>1)
				this.Valid = true;
		};
		this.Add_Unit = function(__unit)
		{
			if(__unit.length!=4)return;
			if(__unit[3]>=players.length)return;
			units.push(__unit);
		};
		this.Add_City = function(__city)
		{
			if(__city.length!=4)return;
			if(__city[3]>=players.length)return;
			cities.push(__city);
		};
		this.Add_Weather = function(__weather)
		{
			if(__weather.length==0)return;
			weather[0] = (__weather.charAt(0)=='1') ? true : false;
			for(let number,i=1;i<__weather.length;i++)
			{
				number = parseInt(__weather.charAt(i));
				if(number>=Weather_Data.Global_Amount || number<0 || number==NaN)
				{
					i = __weather.indexOf(":", i);
					continue;
				}
				let start = parseInt(__weather.substring(i+1, __weather.indexOf("-", i)));
				let rate = parseInt(__weather.substring(__weather.indexOf("-", i)+1, __weather.indexOf(":", i)));
				i = __weather.indexOf(":", i);
				if(start==NaN || rate==NaN)
					continue;
				weather.push([number,start,rate]);
			}
		};
		this.Script = function(str)
		{
			script = str;
		};
		this.Start = function(Game)
		{
			if(!this.Valid)return;
			for(var i=0;i<players.length;i++)
			{
				Game.Add_Player(players[i], i+1);
			}

			return [terrain_data, units, cities, weather];
		};
	};

	this.Read = function(__input)
	{
		var ELEMENTS = 10;
		var dividers = new Array(ELEMENTS);
		for(var i=0,x=0;i<ELEMENTS;i++)
		{	// break if not enough data elements
			x = __input.indexOf(";", x+1);
			if(x==-1)
				return;
			dividers[i] = x;
		}	// continue if data is ok
		var __data = new Array(ELEMENTS);
		__data[0] = __input.substring(0, dividers[0]);
			// id
		__data[1] = __input.substring(dividers[0]+1, dividers[1]);
			// name
		__data[2] = parseInt(__input.substring(dividers[1]+1, dividers[2]));
			// terrain width
		__data[3] = parseInt(__input.substring(dividers[2]+1, dividers[3]));
			// terrain height
		var temp_str = __input.substring(dividers[3]+1, dividers[4]);
			temp_len = __data[2]*__data[3];
		var temp_array = new Array(temp_len),
			temp_last_loc = 0, temp_next_loc;

		for(var i=0;i<temp_len;i++)
		{
			temp_next_loc = temp_str.indexOf(":", temp_last_loc);
			temp_array[i] = parseInt(temp_str.substring(temp_last_loc, temp_next_loc));
			temp_last_loc = temp_next_loc+1;
		}

		__data[4] = temp_array;
			// terrain values (x,y pattern)

		temp_str = __input.substring(dividers[4]+1, dividers[5]);
		temp_array = new Array();
		temp_last_loc = 0;

		while(true)
		{
			temp_next_loc = temp_str.indexOf(":", temp_last_loc);
			if(temp_next_loc==-1)break;
			temp_array.push(temp_str.substring(temp_last_loc, temp_next_loc));
			temp_last_loc = temp_next_loc+1;
		}

		__data[5] = temp_array;
			// players [name]

		temp_str = __input.substring(dividers[5]+1, dividers[6]);
		temp_array = new Array();
		temp_last_loc = 0;
		var temp_data_str,temp_data_value;

		while(true)
		{
			temp_next_loc = temp_str.indexOf(":", temp_last_loc);
			if(temp_next_loc==-1)break;
			temp_data_value = new Array(4);
			temp_data_str = temp_str.substring(temp_last_loc, temp_next_loc);

			var __NEXT_LOC = temp_data_str.indexOf(","),
				__LAST_LOC = 0;
			temp_data_value[0] = parseInt(temp_data_str.substring(0, __NEXT_LOC));
			__LAST_LOC = __NEXT_LOC+1;
			__NEXT_LOC = temp_data_str.indexOf(",", __LAST_LOC);
			temp_data_value[1] = parseInt(temp_data_str.substring(__LAST_LOC, __NEXT_LOC));
			__LAST_LOC = __NEXT_LOC+1;
			__NEXT_LOC = temp_data_str.indexOf(",", __LAST_LOC);
			temp_data_value[2] = parseInt(temp_data_str.substring(__LAST_LOC, __NEXT_LOC));
			__LAST_LOC = __NEXT_LOC+1;
			__NEXT_LOC = temp_data_str.length;
			temp_data_value[3] = parseInt(temp_data_str.substring(__LAST_LOC, __NEXT_LOC));

			temp_array.push(temp_data_value);
			temp_last_loc = temp_next_loc+1;
		}

		__data[6] = temp_array;
			// units [id, x, y, player]

		temp_str = __input.substring(dividers[6]+1, dividers[7]);
		temp_array = new Array();
		temp_last_loc = 0;

		while(true)
		{
			temp_next_loc = temp_str.indexOf(":", temp_last_loc);
			if(temp_next_loc==-1)break;
			temp_data_value = new Array(4);
			temp_data_str = temp_str.substring(temp_last_loc, temp_next_loc);

			var __NEXT_LOC = temp_data_str.indexOf(","),
				__LAST_LOC = 0;
			temp_data_value[0] = parseInt(temp_data_str.substring(0, __NEXT_LOC));
			__LAST_LOC = __NEXT_LOC+1;
			__NEXT_LOC = temp_data_str.indexOf(",", __LAST_LOC);
			temp_data_value[1] = parseInt(temp_data_str.substring(__LAST_LOC, __NEXT_LOC));
			__LAST_LOC = __NEXT_LOC+1;
			__NEXT_LOC = temp_data_str.indexOf(",", __LAST_LOC);
			temp_data_value[2] = parseInt(temp_data_str.substring(__LAST_LOC, __NEXT_LOC));
			__LAST_LOC = __NEXT_LOC+1;
			__NEXT_LOC = temp_data_str.length;
			temp_data_value[3] = parseInt(temp_data_str.substring(__LAST_LOC, __NEXT_LOC));

			temp_array.push(temp_data_value);
			temp_last_loc = temp_next_loc+1;
		}

		__data[7] = temp_array;
			// cities [id, x, y, player]

		__data[8] = __input.substring(dividers[7]+1, dividers[8]);
			// weather

		__data[9] = __input.substring(dividers[8]+1, dividers[9]);
			// script

			/// set map
		var _map_data = new Array(__data[2]);
		for(var x=0,i=0;x<__data[2];x++)
		{
			_map_data[x] = new Array(__data[3]);
			for(var y=0;y<__data[3];y++)
			{
				_map_data[x][y] = __data[4][i++];
			}
		}

		// ad id when synching to server
		var cur_map = new Map_Data(_map_data, __data[1], __data[0], __input);

		for(var i=0;i<__data[5].length;i++)
		{	/// go thru and set players
			cur_map.Add_Player(__data[5][i]);
		}
		for(var i=0;i<__data[6].length;i++)
		{	/// now set units
			cur_map.Add_Unit(__data[6][i]);
		}
		for(var i=0;i<__data[7].length;i++)
		{	/// now set cities
			cur_map.Add_City(__data[7][i]);
		}
		cur_map.Add_Weather(__data[8]);

		cur_map.Script(__data[9]);

		return cur_map;
	};
};
var Map_Reader = new Map_Reader_Class();
