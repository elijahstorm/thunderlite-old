var AI_Class = function(_last_game, _ai_player, _index)
{
	if(_index>5)
	{ // if it has checked 5 turns down the
		return _last_game.Check_Standings(_ai_player);
	}
	if(_index==null)
		_index = 0;

	let self = this;
	let STATE = {
		Scared:0,
		Gathering:1,
		Setup:2,
		Argo:3,
		Domination:4
	};
	let SUB_GAME_AI = false;
	let TIMEOUT = 735;
	let FAKE_GAME;
	self.LOGGING = false;
	let LOGGER = function(args){
		if(!self.LOGGING)return;
		console.log("AI LOG: ",args);
	};
	let Fog_Check = false;
	let Visible_Enemies = null;
	let Estimated_Enemies;
	let Recursion_Break = 50;
	let Last_Attempted = null;
	let STATUS_CHOICE = function(standing, __game, __player)
	{
		if(__game.Game_Over)return; // game over
		if(!__player.Active)return; // not __player's turn

		Refresh_Visible_Enemies(__player);


		/// PREP 1) 	 ---------------------   Defend Capitals   ---------------------------
		/// check if main facilities are being attacked
		/// if there's any danger, instantly react

		var _amt = __player.Building_Amount(),
			_check_;
		for(var i=0;i<_amt;i++)
		{
			_check_ = __player.Get_Building(i);
			if(_check_.Source==1)
			if(CITY_IS_THREATENED(__game, _check_, 6))
			{
				if(Defend_Target(__game, __player, _check_, 6))
					return;
			}
		}
		_amt = __player.Units_Amount();
		for(var i=0;i<_amt;i++)
		{
			_check_ = __player.Get_Unit(i);
			if(_check_.Source==12)
			if(UNIT_IS_THREATENED(__game, _check_, 6))
			{
				if(Defend_Target(__game, __player, _check_, 6))
					return;
			}
		}

		var __unit = HEALTHIEST_ACTIVE_UNIT(__player);

			// stops accidental infinite loops
		if(Last_Attempted==__unit)
		{
			if(--Recursion_Break==0)
			{	// exit infinite loop
				console.error("Infinite loop found in AI Solution");
				__player.End_Turn();
				return;
			}
		}else Recursion_Break = 50;
		Last_Attempted = __unit;


		/// PREP 2) 	 ---------------------   Build   ---------------------------
		/// check if main facilities are being attacked
		/// if there's any danger, instantly react

		if(!~__unit || __unit==null)
		{ // if ai player has no more units to move, then build / act buildings
			let _special_unit = __player.Next_Active_Unit();
			if(~_special_unit)
			{
				Manuver_Capital_Unit(standing, __game, __player, _special_unit);
				return;
			}

			var __city = __player.Next_Active_Building();
			if(!~__city)return;

			if(!__game.Terrain_Map.At(__city.X, __city.Y).Hidden)
				INTERFACE.Scroll_To_Tile(__city.X, __city.Y);
			if(!TRY_BUILD(__game, __player, __city, null, function(__city){
				INTERFACE.Draw();
				setTimeout(function(){
					INTERFACE.Draw();
					STATUS_CHOICE(Check_Standings(__player), __game, __player);
				}, TIMEOUT);
			}))
				__city.End_Turn();
			return;
		}



		/// PREP 3) 	 ---------------------   Regular Decision Making   ---------------------------
		/// depending on the status of the ai player, vs all the opponents,
		/// respond in the best tactical way

		if(standing==STATE.Setup)
		{
			Set_Position(__game, __player, __unit);
		}
		else if(standing==STATE.Argo)
		{
			Be_Hostile(__game, __player, __unit);
		}
		else if(standing==STATE.Gathering)
		{
			Gather_Strength(__game, __player, __unit);
		}
		else if(standing==STATE.Domination)
		{
			Winning(__game, __player, __unit);
		}
		else if(standing==STATE.Scared)
		{
			Run_Away(__game, __player, __unit);
		}
		else
		{
			console.error("no standing data, could not figure out what to do");
			__player.End_Turn();
		}
	};

	var Path_Find = function(mapHandler, unit, start, end, attacking, cantCrossEnemy)
	{
		var map = new Array(mapHandler.Width);
		for(var i=0;i<mapHandler.Width;i++)
		{
			map[i] = new Array(mapHandler.Height);
			for(var j=0;j<mapHandler.Height;j++)
				map[i][j] = mapHandler.At(i, j);
		}

		// shortcuts for speed
		var	abs = Math.abs;
		var	max = Math.max;
		var	pow = Math.pow;
		var	sqrt = Math.sqrt;
		var worldWidth = map[0].length;
		var worldHeight = map.length;
		var worldSize =	worldWidth * worldHeight;
		var maxMovement = 99;//unit.Movement;

		var distanceFunction = function(Point, Goal)
		{	// linear movement - no diagonals - just cardinal directions (NSEW)
			return abs(Point.x - Goal.x) + abs(Point.y - Goal.y);
		};
		var findNeighbours = function(){}; // empty

		// Neighbours functions, used by findNeighbours function
		// to locate adjacent available cells that aren't blocked

		// Returns every available North, South, East or West
		// cell that is empty. No diagonals,
		// unless distanceFunction function is not Manhattan
		function Neighbours(x, y)
		{	// works for a specific square
			var	N = y - 1,
			S = y + 1,
			E = x + 1,
			W = x - 1,
			myN = N > -1 && canWalkHere(x, N),
			myS = S < worldHeight && canWalkHere(x, S),
			myE = E < worldWidth && canWalkHere(E, y),
			myW = W > -1 && canWalkHere(W, y),
			result = [];
			if(myN)
			result.push({x:x, y:N});
			if(myE)
			result.push({x:E, y:y});
			if(myS)
			result.push({x:x, y:S});
			if(myW)
			result.push({x:W, y:y});
			findNeighbours(myN, myS, myE, myW, N, S, E, W, result);
			return result;
		}


		// returns boolean value (map cell is available and open)
		function canWalkHere(x, y)
		{
			if((x>=map.length) || (y>=map[x].length))
				return false;
			if(cantCrossEnemy)
			if(unit.Game.Units_Map.At(x, y)!=null)
			if(unit.Game.Units_Map.At(x, y).Player!=unit.Player)
				return false;

			return unit.Calculate_Move_Cost(map[x][y]) < maxMovement;
		};

		// Node function, returns a new object with Node properties
		// Used in the calculatePath function to store route costs, etc.
		function Node(Parent, Point, Cost)
		{
			var newNode = {
				// pointer to another Node object
				Parent:Parent,
				// array index of this Node in the map linear array
				value:Point.x + (Point.y * worldWidth),
				// the location coordinates of this Node
				x:Point.x,
				y:Point.y,
				totalMovementCost:Cost,
				// the heuristic estimated cost
				// of an entire path using this node
				f:0,
				// the distanceFunction cost to get
				// from the starting point to this node
				g:0
			};

			return newNode;
		};

		// Path function, executes AStar algorithm operations
		function calculatePath()
		{
			// create Nodes from the Start and End x,y coordinates
			var	mypathStart = Node(null, {x:start[0], y:start[1]}, 0);
			var mypathEnd = Node(null, {x:end[0], y:end[1]}, 0);

			// create an array that will contain all map cells
			var AStar = new Array(worldSize);
			// list of currently open Nodes
			var Open = [mypathStart];
			// list of closed Nodes
			var Closed = [];
			// list of the final output array
			var result = [],
				lowestResultCost = null;
			// reference to a Node (that is nearby)
			var myNeighbours;
			// reference to a Node (that we are considering now)
			var myNode;
			// reference to a Node (that starts a path in question)
			var myPath;
			// temp integer variables used in the calculations
			var length, max, min, i, j;
			// iterate through the open list until none are left

			while(length = Open.length)
			{
				max = worldSize;
				min = -1;
				for(i = 0; i < length; i++)
				{
					if(Open[i].f < max)
					{
						max = Open[i].f;
						min = i;
					}
				}
				// grab the next node and remove it from Open array
				myNode = Open.splice(min, 1)[0];
				// is it the destination node?
// LOGGER(myNode.value === mypathEnd.value);
// console.error(myNode.value, mypathEnd.value);

				if(myNode.value === mypathEnd.value)
				{
// console.error("whoa",myNode.Parent.x, myNode.Parent.y);
// console.error(lowestResultCost, myNode.totalMovementCost);
					if(lowestResultCost==null || lowestResultCost > myNode.totalMovementCost)
					{
						myPath = Closed[Closed.push(myNode) - 1];
						result = [];
						AStar[myNode.value] = false;
						lowestResultCost = myNode.totalMovementCost;
						do
						{
							result.push([myPath.x, myPath.y]);
						}
						while (myPath = myPath.Parent);
						// clear the working arrays
						// AStar = Closed = Open = [];
						// we want to start to finish
						result.reverse();
					}
// LOGGER(result);
					continue;
				}
				// find which nearby nodes are walkable
				myNeighbours = Neighbours(myNode.x, myNode.y);
				// test each one that hasn't been tried already

				for(i = 0, j = myNeighbours.length; i < j; i++)
				{
					myPath = Node(myNode, myNeighbours[i], myNode.totalMovementCost);
					for(var asCheck in Closed)
					{
						if (!AStar[Closed[asCheck].value])
						{
							if (Closed[asCheck].value==myPath.value)
							{
// LOGGER("values",Closed[asCheck].value,myPath.value);
// LOGGER("checking",myPath.x,myPath.y);
// LOGGER("asCheck",asCheck);
// LOGGER("VALUE",Closed[asCheck].Parent);
								if (Closed[asCheck].Parent!=undefined)
								{
// LOGGER(Closed[asCheck]);
// LOGGER(myNode);
									if(Closed[asCheck].Parent.totalMovementCost>myNode.totalMovementCost)
									{	// if we found a cheaper route, add this route to the list!
// LOGGER(Closed[asCheck].Parent.totalMovementCost,"is LARGER than",myNode.totalMovementCost);
										AStar[myPath.value] = false;
// LOGGER("Current");
// LOGGER(myPath);
// LOGGER("Old");
// LOGGER(Closed[asCheck]);
										break;
									}
// LOGGER(Closed[asCheck].Parent.totalMovementCost,"is cheaper than",myNode.totalMovementCost);
								}
							}
						}
					}

					if (!AStar[myPath.value])
					{
// LOGGER("AStar",myPath.x,myPath.y);
						// estimated cost of this particular route so far
						myPath.g = myNode.g + distanceFunction(myNeighbours[i], myNode);
						// estimated cost of entire guessed route to the destination
						myPath.f = myPath.g + distanceFunction(myNeighbours[i], mypathEnd);
						// remember this new path for testing above
						myPath.totalMovementCost += unit.Calculate_Move_Cost(map[myPath.x][myPath.y]);
// console.error("PAHT",myPath.totalMovementCost);
						Open.push(myPath);
						// mark this node in the map graph as visited
						AStar[myPath.value] = true;
					}
				}
				// remember this route as having no more untested options
				Closed.push(myNode);
			} // keep iterating until the Open list is empty
// LOGGER(result);

			return result;
		}

		// actually calculate the a-star path!
		// this returns an array of coordinates
		// that is empty if no path is possible
		return calculatePath();
	};

	var DECISION = function(weights)
	{
		if(weights==null)return -1;
		if(weights.length==null)return 0;
		var length = weights.length;
		var choice = length-1;
		var min = weights[0], total = weights[0];

		for(var i=1;i<length;i++)
		{
			if(min>weights[i])
				min = weights[i];
			total+=weights[i];
		}

		var random = (Math.random() * (total-min)) + min - weights[0];

		for(var i=0;i<length;i++)
		{
			if(random<0)
			{
				choice = i;;
				break;
			}
			random-=weights[i];
		}
		return choice;
	};
	var CLOSEST_REACHABLE_SPOT = function(__game, __unit, _x, _y)
	{
		var result = [__unit.X, __unit.Y];
		var movableSpaces = __unit.Current_Path().All_Movable_Spaces();

		var distanceFunction = function(point_x, point_y, goal_x, goal_y)
		{
			return Math.abs(point_x - goal_x) + Math.abs(point_y - goal_y);
		};

		var closest = distanceFunction(__unit.X, __unit.Y, _x, _y),
			checkCurrent;

		for(var i=0;i<movableSpaces.length;i++)
		{
			var city = __game.Cities_Map.At(movableSpaces[i][0], movableSpaces[i][1]);
			if(city!=null)
			if(city.Active && city.Owner==__unit.Player)continue;
			if(__game.Units_Map.At(movableSpaces[i][0], movableSpaces[i][1])!=null)
				continue;
			checkCurrent = distanceFunction(movableSpaces[i][0], movableSpaces[i][1], _x, _y);

			if(checkCurrent<closest)
			{
				closest = checkCurrent;
				result[0] = movableSpaces[i][0];
				result[1] = movableSpaces[i][1];
			}
		}

		return result;
	};

	// TO DO
	// IF ACTIVE PLAYER UNIT IN WAY OF GOOD SPOT,
	// CALL TO MOVE THAT GUY, THEN GO BACK TO FINISH
	// FIGURING OUT PREVIOUS UNIT MOVE (newly opened destination)

		////////////////////////
		/** Helper functions  */
		////////////////////////
	var ENEMY_AVERAGE_ARMOR = function(__game, attacker)
	{
		var types = new Array(Char_Data.ArmorToStr.length);
		var best = 0;


		for(var i=0;i<__game.Total_Players();i++)
		{
			var player = __game.Player(i);
			if(player==attacker)continue;
			for(var j=0;j<player.Units_Amount();j++)
				types[player.Get_Unit(j).Armor]++;
		}

		for(var i=1;i<types.length;i++)
		{
			if(types[best]<types[i])
				best = i;
		}

		return best;
	};
	var BEST_WEAPON_TYPE = function(armor)
	{
		if(armor==0)
			return 0;
		if(armor==2)
			return 2;
		return 1;
	};
	var CAN_CAPTURE = function(__unit)
	{
		var startTurnMods = __unit.Mods_By_Type("Start Turn");

		for(var i=0;i<startTurnMods.length;i++)
		{
			if(startTurnMods[i].Name=="Capture")
			{	// it can

				return true;
			}
		}	 // it did not find right mod,
		return false; // so it cannot
	};
	var UNIT_IS_THREATENED = function(__game, __unit, range)
	{	/** If there is strong enemies within killing range */
		var checked_unit,
			units_amt = __game.Unit_Amount(),
			mod_check;
		var defenders = 0,
			attackers = 0;

		for(var i=0;i<units_amt;i++)
		{
			checked_unit = __game.Get_Unit(i);
			if(checked_unit==__unit)continue;
			if(checked_unit.Type==2 && __unit.Type==0)continue;
			if(checked_unit.Type==0 && __unit.Type==2)continue;

			if(checked_unit.Player==__unit.Player)
			if(Within_Range(checked_unit, __unit.X, __unit.Y, range-2))
			{
				defenders++;
				continue;
			}
			if(checked_unit.Alpha.Get()<255)continue;
			if(Visible_Enemies!=null)
			if(!Visible_Enemies.includes(checked_unit))continue;
			if(Within_Range(checked_unit, __unit.X, __unit.Y, range))
				attackers++;
		}

		return (attackers >= defenders);
	};
	var CITY_IS_THREATENED = function(__game, __city, range)
	{	/** If there is capturing enemies in the near vacinity */
		var checked_unit,
			units_amt = __game.Unit_Amount(),
			mod_check;
		var defenders = 0,
			attackers = 0;

		for(var i=0;i<units_amt;i++)
		{
			checked_unit = __game.Get_Unit(i);

			if(checked_unit.Unit_Type!=__city.Terrain.Type)continue;

			if(checked_unit.Player==__city.Owner)
			{
				if(Within_Range(checked_unit, __city.X, __city.Y, range-2))
					defenders++;
				continue;
			}
			if(checked_unit.Alpha.Get()<255)continue;
			if(Visible_Enemies!=null)
			if(!Visible_Enemies.includes(checked_unit))continue;
			if(!Within_Range(checked_unit, __city.X, __city.Y, range))continue;
			mod_check = checked_unit.Modifier_Amt();
			for(var j=0;j<mod_check;j++)
			{
				if(checked_unit.Modifier(j)==Mod_List.Units.Start_Turn.Capture)
				{
					if(__city.X==checked_unit.X && __city.Y==checked_unit.Y)
						return true;
					attackers++;
					break;
				}
			}
		}

		return (attackers >= defenders);
	};
	var TERRAIN_IS_DEFENDED = function(__game, __player, __terrain, range)
	{	/** If a specific square is defend stronger than ai player's attacking force */
		var checked_unit,
			units_amt = __game.Unit_Amount(),
			mod_check;
		var defenders = 0,
			attackers = 0;

		for(var i=0;i<units_amt;i++)
		{
			checked_unit = __game.Get_Unit(i);

			if(checked_unit.Player==__player)
			{
				if(Within_Range(checked_unit, __terrain.X, __terrain.Y, range-2))
					defenders++;
				continue;
			}
			if(checked_unit.Alpha.Get()<255)continue;
			if(Visible_Enemies!=null)
			if(!Visible_Enemies.includes(checked_unit))continue;
			if(!Within_Range(checked_unit, __terrain.X, __terrain.Y, range))continue;
			mod_check = checked_unit.Modifier_Amt();
			for(var j=0;j<mod_check;j++)
			{
				if(checked_unit.Modifier(j)==Mod_List.Units.Start_Turn.Capture)
				{
					if(__terrain.X==checked_unit.X && __terrain.Y==checked_unit.Y)
						return true;
					attackers++;
					break;
				}
			}
		}

		return (attackers >= defenders);
	};
	var GET_ENEMIES_IN_AREA = function(__game, __player, center_x, center_y, range)
	{	/** Returns a list of enemies in the specified area */
		var checked_unit,
			units_amt = __game.Unit_Amount();
		var _enemies = [];

		for(var i=0;i<units_amt;i++)
		{
			checked_unit = __game.Get_Unit(i);
			if(Visible_Enemies!=null)
			if(!Visible_Enemies.includes(checked_unit))continue;
			if(checked_unit.Player!=__player)
			if(checked_unit.Alpha.Get()==255)
			if(Within_Range(checked_unit, center_x, center_y, range))
			{
				_enemies.push(checked_unit);
			}
		}

		return _enemies;
	};
	var BEST_DEFENSE_BY_AREA = function(__game, __player, center_x, center_y, range)
	{	/** Averages enemy units in that area, to pick best unit to respond with */
		var checked_unit,
			units_amt = __game.Unit_Amount();
		var _enemies = [],
			amt_armor = [0,0,0],
			amt_weapon = [0,0,0],
			amt_type = [0,0,0];

		for(var i=0;i<units_amt;i++)
		{
			checked_unit = __game.Get_Unit(i);
			if(checked_unit.Player!=__player)
			if(checked_unit.Alpha.Get()==255)
			if(Within_Range(checked_unit, center_x, center_y, range))
			{
				_enemies.push(checked_unit);
				amt_armor[checked_unit.Armor]++;
				amt_weapon[checked_unit.Weapon]++;
				amt_type[checked_unit.Unit_Type]++;
			}
		}

		if(_enemies.length==0)return -1;

		var best_choices = [];

		for(var i=1;i<Char_Data.CHARS.length;i++)
		{
			checked_unit = Char_Data.CHARS[i];

			if(i==12 || i==13 || i==14 || i==18)
				continue;

				// if no gound/sea units, dont defend with that type
			if(amt_type[2]==0)
			if(checked_unit.Type==2)
				continue;
			if(amt_type[0]==0)
			if(checked_unit.Type==0)
				continue;

				// if none of an armor type, don't defend with that weapon type
			if(amt_armor[0]==0)
			if(checked_unit.Weapon==0)
				continue;
			if(amt_armor[2]==0)
			if(checked_unit.Weapon==2)
				continue;

				// if over half the units in the area are air, make sure defender is anti-air
			if(amt_type[1]/_enemies.length>=0.5)
			if(!checked_unit.Modifiers.includes(Mod_List.Units.Can_Attack.Air_Raid))
				continue;
				// if over half the units in the area are sea, make sure defender is anti-sea
			if(amt_type[2]/_enemies.length>=0.5)
			if(!checked_unit.Modifiers.includes(Mod_List.Units.Can_Attack.Bombard) &&
				checked_unit.Type!=2)
				continue;

			best_choices.push(i);
		}

		return best_choices;
	};
	var BEST_BUILD_CHOICE = function(__game, __player, __resources, __loc_type)
	{	/** Find the tactically best unit to create */

		// to do
		// check if stealth units
		// then build Radar units

		var unit_index = 1; // here to find unit to buy
		if(__player.Ground_Control())
		{	// check for suffient anti-air in game
			var player_amt = __game.Total_Players(),
				player;
			var airUnits = 0;
			for(var j=0;j<player_amt;j++)
			{
				player = __game.Player(j);
				if(player==__player)continue;
				var total = __game.Player(j).Units_Amount();
				for(var i=0;i<total;i++)
				{
					var unit = player.Get_Unit(i);
					if(unit.Move_Type==3 ||
						unit.Move_Type==4 ||
						unit.Move_Type==5)
						airUnits++;
				}
			}

			if(airUnits>0)
			{
				var missing_anti_air = true;
				var units = __player.Units_Amount();
				var unit;
				for(var i=0;i<units;i++)
				{
					unit = __player.Get_Unit(i);
					if(unit.Source==6 || unit.Source==15 || unit.Source==20)
					{
						missing_anti_air = false;
						continue;
					}
				}
			}

			if(airUnits/__game.Unit_Amount()>=0.5)
			if(__player.Air_Control())
				return 3; // jammer truck -> anti air
			if(airUnits/__game.Unit_Amount()>=0.3 || missing_anti_air)
			{
				if(__player.Air_Control())
				if(__player.Calculate_Cost(15)<=__resources)
					return 15; // raptor figher
				if(__player.Ground_Control())
				if(__player.Calculate_Cost(6)<=__resources)
					return 6; // flak tank
				if(__player.Water_Control())
				if(__player.Calculate_Cost(20)<=__resources)
					return 20; // hunter support
			}
		}

		var bestWeapon = BEST_WEAPON_TYPE(ENEMY_AVERAGE_ARMOR(__game, __player));
		var bestChoices = new Array();
		var not_allowed = __player.Disallowed();

		for(var i=1;i<Char_Data.CHARS.length;i++)
		{
			if(__loc_type==0)
			if(Char_Data.CHARS[i].Type==2)
				continue;
			if(__loc_type==2)
			if(Char_Data.CHARS[i].Type==0)
				continue;
			if(Char_Data.CHARS[i].Weapon==bestWeapon)
			if(__player.Calculate_Cost(i)<=__resources)
			{
				var allowed = true;
				for(var j=0;j<not_allowed.length;j++)
				if(not_allowed[j]==i)
				{
					allowed = false;
					break;
				}
				if(allowed)
					bestChoices.push(i);
			}
		}
		unit_index = Math.floor(Math.random()*bestChoices.length);

		return bestChoices[unit_index];
	};
	var FIND_BEST_CHASE = function(__game, __player, __unit, spaces, destination, route)
	{	/** Find the route to go towards the destination */
		var DECISION_MADE = true;

		if(route==null)
			route = new Path_Find(__game.Terrain_Map, __unit, [__unit.X, __unit.Y], [destination[0], destination[1]]);

		var _x = -1,
			_y = -1,
			move = __unit.Movement+1;

		for(var i=0;i<route.length;i++)
		{	// finds closest non occupied chase path
			var terrain_type = __game.Terrain_Map.At(route[i][0], route[i][1]);
			move-=__unit.Calculate_Move_Cost(terrain_type);
			if(move<0)
			{
				var result = CLOSEST_REACHABLE_SPOT(__game, __unit, _x, _y);
				_x = result[0];
				_y = result[1];
				break;
			}

			if(__game.Units_Map.At(route[i][0], route[i][1])!=null)
				continue;
			if(terrain_type.Building!=null)
			if(terrain_type.Building.Active && terrain_type.Building.Owner==__player)
				continue;
			_x = route[i][0];
			_y = route[i][1];
		}

		if(_x!=-1 && _y!=-1)
		{	// found a good path to travel
			destination[0] = _x;
			destination[1] = _y;
		}	// otherwise, can't travel because path is too populated
		else DECISION_MADE = false;

		return DECISION_MADE;
	};
	var BEST_HEAL_CHOICE = function(__game, __player, __unit, spaces, destination)
	{	/** Find the best choice to heal the unit */
		var DECISION_MADE = false;

		// if no need to heal, don't bother
		if(__unit.Health==__unit.Max_Health)return DECISION_MADE;

		if(__unit.Move_Type!=3)
		if(__unit.Move_Type!=4)
		if(__unit.Move_Type!=5)
		{
			var checkForCapital;

			for(var j=0;j<spaces.length;j++)
			{
				checkForCapital = __game.Cities_Map.At(spaces[j][0], spaces[j][1]);
				if(checkForCapital==null)continue;
				if(checkForCapital.Owner!=__player)continue;
				if(checkForCapital.Source!=1)continue;
				if(__game.Units_Map.At(spaces[j][0], spaces[j][1])!=null)continue; // space occupied
				if(__unit.X==spaces[j][0] && __unit.Y==spaces[j][1])break; // already on capital, so stay

				DECISION_MADE = true;
				destination[0] = checkForCapital.X;
				destination[1] = checkForCapital.Y;
				return DECISION_MADE;
			}
		}

		var checkForBuilding = __game.Cities_Map.At(__unit.X, __unit.Y);
		if(checkForBuilding!=null)
		if(Building_Data.PLACE[checkForBuilding.Source].Act==null)
		{
			var canRepair = __unit.Mods_By_Type("Self Action");
			for(var i=0;i<canRepair.length;i++)
			if(canRepair[i].Name=="Repairable")
			{
				DECISION_MADE = true;
				destination[0] = __unit.X;
				destination[1] = __unit.Y;
				__unit.Repair();
				break;
			}
		}

		return DECISION_MADE;
	};
	var HEALTHIEST_ACTIVE_UNIT = function(player)
	{	/** Uses strongest units first, and ranomizes near-similar choices */
		var all_units = [],
			all_choices = [];
		var armySize = player.Units_Amount();
		var cur_unit;
		for(var i=0;i<armySize;i++)
		{
			cur_unit = player.Get_Unit(i);
			if(cur_unit.Active)
			if(cur_unit.Source!=12)
			{
				all_units.push(cur_unit);
				all_choices.push(cur_unit.Health/cur_unit.Max_Health);
			}
		}
		if(all_units.length==0)
			return null;

		var best_unit = all_units[DECISION(all_choices)];

		return best_unit;
	};


		/////////////////////////////
		/** Unit Specific Actions  */
		/////////////////////////////
	var TRY_BUILD = function(__game, __player, __city, unit_index, callback)
	{	/** If city can create a new unit, build the best one */
		if(unit_index==null)
			unit_index = BEST_BUILD_CHOICE(__game, __player, __player.Cash_Money(), __city.Terrain.Type);

		if(unit_index!=null)
		{
			if(__game.Build(__city, unit_index, callback))
			{
				if(!__game.Terrain_Map.At(__city.X, __city.Y).Hidden)
					INTERFACE.Scroll_To_Tile(__city.X, __city.Y);
				if(callback!=null)callback();
				return true;
			}
		}
		if(callback!=null)callback();
		return false;
	};
	var TRY_CAPTURE = function(__game, __player, __unit, spaces, destination)
	{	/** If city in range, run to capture best choice */
		var DECISION_MADE = false;

		if(!CAN_CAPTURE(__unit))return DECISION_MADE;
		// it can capture, so move forward with trying to capture

		var checkCaptureCity,
			bestCityToCapture,
			bestBuildingStature = 100,
			checkedBuildingStature;

		// check available cities in range to capture
		// see which is best
		for(var j=0;j<spaces.length;j++)
		{
			checkCaptureCity = __game.Cities_Map.At(spaces[j][0], spaces[j][1]);
			if(checkCaptureCity==null)continue;
			if(checkCaptureCity.Owner==__player)continue;
			if(!Terrain_Data.Is_Reachable(checkCaptureCity.Terrain.Type, __unit.Type))
				continue; // can't reach proper terrain type
			if(checkCaptureCity.Defense>=__unit.Health)
				continue; // if the guy will die, dont try and capture it
			if(__game.Units_Map.At(checkCaptureCity.X, checkCaptureCity.Y)!=null)
			if(__game.Units_Map.At(checkCaptureCity.X, checkCaptureCity.Y)!=__unit)continue;

			checkedBuildingStature = checkCaptureCity.Stature - ((__unit.Health/__unit.Max_Health)*10);
			if(checkedBuildingStature<0)checkedBuildingStature = 0;

			if(!DECISION_MADE)
			{
				bestCityToCapture = checkCaptureCity;
				bestBuildingStature = checkedBuildingStature;
				destination[0] = bestCityToCapture.X;
				destination[1] = bestCityToCapture.Y;
				DECISION_MADE = true;
				continue;
			}

			if(Building_Data.PLACE[bestCityToCapture.Source]==1)
				continue;

			if(Building_Data.PLACE[checkCaptureCity.Source]==1 || checkedBuildingStature<bestBuildingStature)
			{
				bestCityToCapture = checkCaptureCity;
				bestBuildingStature = checkedBuildingStature;
				destination[0] = bestCityToCapture.X;
				destination[1] = bestCityToCapture.Y;
			}
		}

		return DECISION_MADE;
	};
	var TRY_ATTACK = function(__game, __player, __unit, spaces, destination, moverClass)
	{	/** If enemy in range, attack best choice */
		var DECISION_MADE = false;

		var checkingEnemyUnit,
			checkingEnemyPlayer,
			bestChoiceImpact;
		var all_choices = new Array(), all_enemy = new Array();
		// run reachable spaces for enemies

		for(var i=0;i<spaces.length;i++)
		{
			checkingEnemyUnit = __game.Units_Map.At(spaces[i][0], spaces[i][1]);
			if(checkingEnemyUnit==null)continue;
			if(!__unit.Can_Attack(checkingEnemyUnit))continue;
			if(checkingEnemyUnit.Alpha.Get()<255)
			if(checkingEnemyUnit.Player.Team!=__unit.Player.Team)continue;
			if(Visible_Enemies!=null)
			if(!Visible_Enemies.includes(checkingEnemyUnit))continue;

			var attack_value = AttackImpact(__unit, checkingEnemyUnit);
			if(attack_value+0.2<ReturnFireImpact(__unit, checkingEnemyUnit))continue;

			all_choices.push(attack_value);
			all_enemy.push(checkingEnemyUnit);
			DECISION_MADE = true;
		}
		if(DECISION_MADE)
		{
			var choice = all_enemy[DECISION(all_choices)];
			destination[0] = choice.X;
			destination[1] = choice.Y;
			var route = [[__unit.X, __unit.Y]];
			if(!__unit.Slow_Attack)
			{
				if(__unit.Current_Path().Can_Move(choice.X-1, choice.Y)
					&& __game.Units_Map.At(choice.X-1, choice.Y)==null)
				{
					route[0][0] = choice.X-1;
					route[0][1] = choice.Y;
				}
				if(__unit.Current_Path().Can_Move(choice.X, choice.Y-1)
					&& __game.Units_Map.At(choice.X, choice.Y-1)==null)
				{
					route[0][0] = choice.X;
					route[0][1] = choice.Y-1;
				}
				if(__unit.Current_Path().Can_Move(choice.X+1, choice.Y)
					&& __game.Units_Map.At(choice.X+1, choice.Y)==null)
				{
					route[0][0] = choice.X+1;
					route[0][1] = choice.Y;
				}
				if(__unit.Current_Path().Can_Move(choice.X, choice.Y+1)
					&& __game.Units_Map.At(choice.X, choice.Y+1)==null)
				{
					route[0][0] = choice.X;
					route[0][1] = choice.Y+1;
				}
			}
			if(route.length>1)
			{
				moverClass.Add(route[route.length-2][0], route[route.length-2][1]);
			}
			else if(route[0]==null)DECISION_MADE = false;
			else moverClass.Add(route[0][0], route[0][1]);
		}

		return DECISION_MADE;
	};
	var TRY_ATTACK_UNITS = function(__game, __player, __unit, spaces, destination, moverClass, target_list)
	{	/** If any select enemies are in range, attack best choice */
		var DECISION_MADE = false;

		var checkingEnemyUnit,
			checkingEnemyPlayer,
			bestChoiceImpact;
		var all_choices = new Array(), all_enemy = new Array();
		// run reachable spaces for enemies in list

		for(var i=0;i<spaces.length;i++)
		{
			checkingEnemyUnit = __game.Units_Map.At(spaces[i][0], spaces[i][1]);
			if(checkingEnemyUnit==null)continue;
			if(!__unit.Can_Attack(checkingEnemyUnit))continue;
			if(checkingEnemyUnit.Alpha.Get()<255)
			if(checkingEnemyUnit.Player.Team!=__unit.Player.Team)continue;
			if(!target_list.includes(checkingEnemyUnit))continue;

			var attack_value = AttackImpact(__unit, checkingEnemyUnit);
			if(attack_value+0.2<ReturnFireImpact(__unit, checkingEnemyUnit))continue;

			all_choices.push(attack_value);
			all_enemy.push(checkingEnemyUnit);
			DECISION_MADE = true;
		}
		if(DECISION_MADE)
		{
			var choice = all_enemy[DECISION(all_choices)];
			destination[0] = choice.X;
			destination[1] = choice.Y;
			var route = [[__unit.X, __unit.Y]];
			if(!__unit.Slow_Attack)
			{
				if(__unit.Current_Path().Can_Move(choice.X-1, choice.Y)
					&& __game.Units_Map.At(choice.X-1, choice.Y)==null)
				{
					route[0][0] = choice.X-1;
					route[0][1] = choice.Y;
				}
				if(__unit.Current_Path().Can_Move(choice.X, choice.Y-1)
					&& __game.Units_Map.At(choice.X, choice.Y-1)==null)
				{
					route[0][0] = choice.X;
					route[0][1] = choice.Y-1;
				}
				if(__unit.Current_Path().Can_Move(choice.X+1, choice.Y)
					&& __game.Units_Map.At(choice.X+1, choice.Y)==null)
				{
					route[0][0] = choice.X+1;
					route[0][1] = choice.Y;
				}
				if(__unit.Current_Path().Can_Move(choice.X, choice.Y+1)
					&& __game.Units_Map.At(choice.X, choice.Y+1)==null)
				{
					route[0][0] = choice.X;
					route[0][1] = choice.Y+1;
				}
			}
			if(route.length>1)
			{
				moverClass.Add(route[route.length-2][0], route[route.length-2][1]);
			}
			else if(route[0]==null)DECISION_MADE = false;
			else moverClass.Add(route[0][0], route[0][1]);
		}

		return DECISION_MADE;
	};
	var TARGET_LOC = function(__game, __player, __unit, spaces, destination, __target_source)
	{	/** Runs directly to location, unless it's unreachable */
		if(__unit.Movement==0)return false;
			// if can't move, stop considering this

		destination[0] = __target_source.X;
		destination[1] = __target_source.Y;

		return FIND_BEST_CHASE(__game, __player, __unit, spaces, destination);
	};
	var CHASE_CITY = function(__game, __player, __unit, spaces, destination)
	{	/** Chases fastest capturable city */
		var DECISION_MADE = false;

		// if can't capture, stop considering this
		if(!CAN_CAPTURE(__unit))return DECISION_MADE;
		// if can't move, stop considering this
		if(__unit.Movement==0)return DECISION_MADE;

		var checkCaptureCity,
			bestCityToCapture,
			bestBuildingStature = 100,
			checkedBuildingStature;
		var best_path,checked_path;

		// check all cities, prioritizing enemy owned cities over idle cities
		for(var i=0;i<__game.Building_Amount();i++)
		{
			checkCaptureCity = __game.Get_Building(i);
			if(checkCaptureCity==null)continue;
			if(checkCaptureCity.Owner==__player)continue;
			if(!Terrain_Data.Is_Reachable(checkCaptureCity.Terrain.Type, __unit.Type))
				continue; // can't reach proper terrain type
			if(checkCaptureCity.Defense>=__unit.Health)
				continue; // if the guy will die, dont try and capture it
			if(__game.Units_Map.At(checkCaptureCity.X, checkCaptureCity.Y)!=null)
			if(__game.Units_Map.At(checkCaptureCity.X, checkCaptureCity.Y)!=__unit)
				continue;

			checkedBuildingStature = checkCaptureCity.Stature - ((__unit.Health/__unit.Max_Health)*10);
			if(checkedBuildingStature<0)checkedBuildingStature = 0;

			if(!DECISION_MADE)
			{
				checked_path = Path_Find(__game.Terrain_Map, __unit, [__unit.X, __unit.Y], [checkCaptureCity.X, checkCaptureCity.Y], false, true);
				if(checked_path.length==0)
					continue; // if cannot reach, dont try
				bestCityToCapture = checkCaptureCity;
				bestBuildingStature = checkedBuildingStature;
				destination[0] = bestCityToCapture.X;
				destination[1] = bestCityToCapture.Y;
				best_path = checked_path;
				DECISION_MADE = true;
				continue;
			}

			// if(Building_Data.PLACE[bestCityToCapture.Source]==1)
				// continue; // this causes units to constantly barrage command center
				/// good for if Winning, but not if Losing

			if(checkedBuildingStature<bestBuildingStature)
			{
				checked_path = Path_Find(__game.Terrain_Map, __unit, [__unit.X, __unit.Y], [checkCaptureCity.X, checkCaptureCity.Y], false, true);
				if(checked_path.length==0)
					continue; // if cannot reach, dont try
				bestCityToCapture = checkCaptureCity;
				bestBuildingStature = checkedBuildingStature;
				destination[0] = bestCityToCapture.X;
				destination[1] = bestCityToCapture.Y;
				best_path = checked_path;
			}
		}
		if(DECISION_MADE)
		{	// since it found the best choice to chase
			// now it can get the closest it can to it
			DECISION_MADE = FIND_BEST_CHASE(__game, __player, __unit, spaces, destination, best_path);
		}

		return DECISION_MADE;
	};
	var CHASE_ENEMY = function(__game, __player, __unit, spaces, destination)
	{	/** Check enemy units, and chase the one that will deal most damage */
		var DECISION_MADE = false;

		// if can't move, stop considering this
		if(__unit.Movement==0)return DECISION_MADE;

		var checkingEnemyUnit,
			checkingEnemyPlayer,
			bestChoiceImpact;
		var best_path,checked_path;

		if(Visible_Enemies!=null)
		if(Visible_Enemies.length==0)
		if(Estimated_Enemies.length!=0)
		{	// if no visible enemies
			for(let i=0;i<Estimated_Enemies.length;i++)
			{
				checkingEnemyUnit = Estimated_Enemies[i];
				if(!__unit.Can_Attack(checkingEnemyUnit))continue;

				checkingAttackImpact = AttackImpact(__unit, checkingEnemyUnit);
				// now check if its best choice
				if(!DECISION_MADE)
				{
					// checked_path = Path_Find(__game.Terrain_Map, __unit, [__unit.X, __unit.Y], [checkingEnemyUnit.X, checkingEnemyUnit.Y], false, true);
					checked_path = Path_Find(__game.Terrain_Map, __unit, [__unit.X, __unit.Y], [checkingEnemyUnit.X, checkingEnemyUnit.Y], false, false);
					if(checked_path.length==0)
						continue; // if cannot reach, dont try
					destination[0] = checkingEnemyUnit.X;
					destination[1] = checkingEnemyUnit.Y;
					bestChoiceImpact = checkingAttackImpact;
					best_path = checked_path;
					DECISION_MADE = true;
					continue;
				}
				if(checkingAttackImpact>bestChoiceImpact)
				{	// do not want to commit to attack if worse off after attack
					checked_path = Path_Find(__game.Terrain_Map, __unit, [__unit.X, __unit.Y], [checkingEnemyUnit.X, checkingEnemyUnit.Y], false, true);
					if(checked_path.length==0)
						continue; // if cannot reach, dont try
					if(ReturnFireImpact(__unit, checkingEnemyUnit)>checkingAttackImpact)continue;
					destination[0] = checkingEnemyUnit.X;
					destination[1] = checkingEnemyUnit.Y;
					bestChoiceImpact = checkingAttackImpact;
					best_path = checked_path;
				}
			}
		}

		if(!DECISION_MADE)
		{	// if no contact found
			for(var i=0;i<__game.Total_Players();i++)
			{
				checkingEnemyPlayer = __game.Player(i);
				if(checkingEnemyPlayer==null)continue;
				if(checkingEnemyPlayer.Team==__player.Team)continue;
					// same team

				// run thru current enemy player's units
				for(var j=0;j<checkingEnemyPlayer.Units_Amount();j++)
				{
					checkingEnemyUnit = checkingEnemyPlayer.Get_Unit(j);
					if(checkingEnemyUnit==null)continue;
					if(!__unit.Can_Attack(checkingEnemyUnit))continue;
					if(checkingEnemyUnit.Alpha.Get()<255)continue;
					if(Visible_Enemies!=null)
					if(!Visible_Enemies.includes(checkingEnemyUnit))continue;

					checkingAttackImpact = AttackImpact(__unit, checkingEnemyUnit);
					// now check if its best choice
					if(!DECISION_MADE)
					{
						// checked_path = Path_Find(__game.Terrain_Map, __unit, [__unit.X, __unit.Y], [checkingEnemyUnit.X, checkingEnemyUnit.Y], false, true);
						checked_path = Path_Find(__game.Terrain_Map, __unit, [__unit.X, __unit.Y], [checkingEnemyUnit.X, checkingEnemyUnit.Y], false, false);
						if(checked_path.length==0)
							continue; // if cannot reach, dont try
						destination[0] = checkingEnemyUnit.X;
						destination[1] = checkingEnemyUnit.Y;
						bestChoiceImpact = checkingAttackImpact;
						best_path = checked_path;
						DECISION_MADE = true;
						continue;
					}
					if(checkingAttackImpact>bestChoiceImpact)
					{	// do not want to commit to attack if worse off after attack
						checked_path = Path_Find(__game.Terrain_Map, __unit, [__unit.X, __unit.Y], [checkingEnemyUnit.X, checkingEnemyUnit.Y], false, true);
						if(checked_path.length==0)
							continue; // if cannot reach, dont try
						if(ReturnFireImpact(__unit, checkingEnemyUnit)>checkingAttackImpact)continue;
						destination[0] = checkingEnemyUnit.X;
						destination[1] = checkingEnemyUnit.Y;
						bestChoiceImpact = checkingAttackImpact;
						best_path = checked_path;
					}
				}
			}
		}
		if(DECISION_MADE)
		{	// since it found the best choice to chase
			// now it can get the closest it can to it
			DECISION_MADE = FIND_BEST_CHASE(__game, __player, __unit, spaces, destination, best_path);
		}

		return DECISION_MADE;
	};
	var FLEE_ENEMY = function(__game, __player, __unit, spaces, destination)
	{	/** is not implemented */
		return BEST_HEAL_CHOICE(__game, __player, __unit, spaces, destination);
	};
	var IDLE_ROAM = function(__game, __player, __unit, spaces, destination)
	{	/** Find the best choice to heal the unit */
		var DECISION_MADE = false;

		var all_choices = new Array(),
			all_weights = new Array();

		if(__unit.Radar())
		{	// remove this later
			var _city = __game.Cities_Map.At(__unit.X, __unit.Y);
			if(_city==null)
			{
				destination[0] = __unit.X;
				destination[1] = __unit.Y;
				return true;
			}
			if(!Building_Data.PLACE[_city.Source].Act)
			{
				destination[0] = __unit.X;
				destination[1] = __unit.Y;
				return true;
			}
		}

		for(var i=0;i<spaces.length;i++)
		{	// go to empty space
			var space_occupied = __game.Units_Map.At(spaces[i][0], spaces[i][1]);
			if(space_occupied!=null)continue;
			space_occupied = __game.Cities_Map.At(spaces[i][0], spaces[i][1]);
			if(space_occupied!=null)continue;

			DECISION_MADE = true;
			all_choices.push(i);
				// the father away, the less likely it should be chosen
			all_weights.push(4/(Math.abs(__unit.X-spaces[i][0]) + Math.abs(__unit.Y-spaces[i][1])));
		}

		if(DECISION_MADE)
		{
			var choice = all_choices[DECISION(all_weights)];

			destination[0] = spaces[choice][0];
			destination[1] = spaces[choice][1];
		}
		else
		{	// stay still / idle
			destination[0] = __unit.X;
			destination[1] = __unit.Y;

			DECISION_MADE = true;
		}

		return DECISION_MADE;
	};


		///////////////////////////////////////////////////////////
		/// These will recur until all units and tasks are done ///
		///////////////////////////////////////////////////////////
		////// depending on how well the ai player is doing, //////
		////// the order in which the above techniques ////////////
		////// will be consider and done. /////////////////////////
		///////////////////////////////////////////////////////////

	var Manuver_Capital_Unit = function(__standing, __game, __player, __unit)
	{	/** To handle how a capital unit will act */
LOGGER(" ");
LOGGER("--");
LOGGER("standing",__standing);
LOGGER(__unit.Name);

			// only build sea units if on a Shore
		let choice = BEST_BUILD_CHOICE(__game, __player, __unit.Cash, (__game.Terrain_Map.At(__unit.X, __unit.Y).Source==Terrain_Data.Get("Shore")) ? null : 0);

		if(choice==null)
		{	// can't afford anything

			// try to mine
			if(Mod_List.Units.Self_Action.Miner.Test(__unit))
			{
				Mod_List.Units.Self_Action.Miner.Do(__unit);
				return;
			}

			// find nearest undefended resource tile
			let t, list = Core.Target.Diamond(6),
				_ore = Terrain_Data.Get("Enriched Ore Deposit");
			for(let i=0;i<list.length;i++)
			{
				t = __game.Terrain_Map.At(__unit.X+list[i][0], __unit.Y+list[i][1]);
				if(t==null)continue;
				if(t.Source==_ore || t.Source==_ore+1)
				if(!TERRAIN_IS_DEFENDED(__game, __player, t, 4))
				{	// now move to it
					var moverClass = new Move_Class(__unit,__unit.X,__unit.Y,__game.Terrain_Map,function(list){});
					__unit.Start_Path(__unit.X, __unit.Y, true);

					LOGGER("ITS IN");

					var destination = [-1, -1];
					var spaces = __unit.Current_Path().All_Movable_Spaces();
					if(TARGET_LOC(__game, __player, __unit, spaces, destination, t))
					{	// if it can make it to that location
						moverClass.Add(destination[0], destination[1]);
						LOGGER("chasing ore deposit", destination[0], destination[1]);

						Prep_Movement(__game, __player, __unit, destination, moverClass);
						return true;
					}
				}
			}
			// could not find a good place to go
			__unit.End_Turn();
			if(!__game.Terrain_Map.At(__unit.X, __unit.Y).Hidden)
				INTERFACE.Scroll_To_Tile(__unit.X, __unit.Y);
			setTimeout(function(){
				INTERFACE.Draw();
				STATUS_CHOICE(Check_Standings(__player), __game, __player);
			}, TIMEOUT);
			return;
		}

		let new_unit = new Characters.Char_Class(__game, choice);
		new_unit.Player = __player;
		let open_spaces = [],
			map = __game.Terrain_Map;

		if(__unit.X!=0)
		if(__game.Units_Map.At(__unit.X-1, __unit.Y)==null)
		if(new_unit.Calculate_Move_Cost(map.At(__unit.X-1, __unit.Y))<10)
		{	// left
			open_spaces.push(0);
		}
		if(__unit.Y!=0)
		if(__game.Units_Map.At(__unit.X, __unit.Y-1)==null)
		if(new_unit.Calculate_Move_Cost(map.At(__unit.X, __unit.Y-1))<10)
		{	// up
			open_spaces.push(1);
		}
		if(__unit.X!=__game.Terrain_Map.Width-1)
		if(__game.Units_Map.At(__unit.X+1, __unit.Y)==null)
		if(new_unit.Calculate_Move_Cost(map.At(__unit.X+1, __unit.Y))<10)
		{	// right
			open_spaces.push(2);
		}
		if(__unit.Y!=__game.Terrain_Map.Height-1)
		if(__game.Units_Map.At(__unit.X, __unit.Y+1)==null)
		if(new_unit.Calculate_Move_Cost(map.At(__unit.X, __unit.Y+1))<10)
		{	// down
			open_spaces.push(3);
		}

		if(open_spaces.length>0)
		{	// can build
			let direction = Math.floor(Math.random()*open_spaces.length);

			let loc_x = __unit.X;
			let loc_y = __unit.Y;
			if(open_spaces[direction]==0)
			{	// create to the left
				loc_x--;
			}
			else if(open_spaces[direction]==1)
			{	// create up
				loc_y--;
			}
			else if(open_spaces[direction]==2)
			{	// create to the right
				loc_x++;
			}
			else if(open_spaces[direction]==3)
			{	// create down
				loc_y++;
			}
			else
			{
				console.error("somethings wrong", direction, open_spaces);
				__unit.End_Turn();
				return;
			}

			if(!__game.Terrain_Map.At(__unit.X, __unit.Y).Hidden)
				INTERFACE.Scroll_To_Tile(__unit.X, __unit.Y);

			SFXs.Retrieve("build").Play();
			__unit.Cash-=__player.Calculate_Cost(choice);
			new_unit.Alpha.data = 0;
			new_unit.Idle = true;
			new_unit.Set_Active(false);
			__game.Add_Unit(new_unit, loc_x, loc_y, __player.Team);
			__unit.End_Turn();
			new_unit.Fade(255, 7);

			setTimeout(function(){
				INTERFACE.Draw();
				STATUS_CHOICE(Check_Standings(__player), __game, __player);
			}, TIMEOUT);
			return;
		}

		// if can't build what want to build
		// dig for resources
		// if no resources below Warmachine
		// run to closest terrain with Resources
		// unless terrain is guarded (too many enemies within 5 spaces)

		__unit.End_Turn();
		return;
	};
	var Defend_Target = function(__game, __player, __target, range)
	{	/** Prioritize units to defend or run to specific target within range */
		var DECISION_MADE = false; // when true, stop looking for move, and go to finish

LOGGER(" ");
LOGGER("!!!");
LOGGER("DEFEND TARGET");
LOGGER(__target.Name);
LOGGER(__target.X, __target.Y);


		var total_units = __player.Units_Amount(),
			currentUnit,
			_enemies = GET_ENEMIES_IN_AREA(__game, __player, __target.X, __target.Y, range);
		var best_choices = BEST_DEFENSE_BY_AREA(__game, __player, __target.X, __target.Y, range);
		if(best_choices==-1)return;
			// no enemies in area

		best_choices = Sort_Units_By_Expense(best_choices);

		for(var i=0;i<total_units;i++)
		{
			currentUnit = __player.Get_Unit(i);
			if(!currentUnit.Active)continue;
			if(!best_choices.includes(currentUnit.Source))continue;

			var moverClass = new Move_Class(currentUnit,currentUnit.X,currentUnit.Y,__game.Terrain_Map,function(list){});
			currentUnit.Start_Path(currentUnit.X, currentUnit.Y, true);

			var destination = [-1, -1];
			var spaces = currentUnit.Current_Path().All_Movable_Spaces();


			/// STEP 1) 	 ---------------------   Attacking   ---------------------------
			/// attack important units in area of attack

			DECISION_MADE = TRY_ATTACK_UNITS(__game, __player, currentUnit, currentUnit.Current_Path().Attackables(), destination, moverClass, _enemies);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)LOGGER("defending", destination[0], destination[1]);


			/// STEP 2) 	 ---------------------   Chase City   ---------------------------
			/// send helpful unit to the defense

			if(!DECISION_MADE)
			{
				DECISION_MADE = TARGET_LOC(__game, __player, currentUnit, spaces, destination, __target);
				if(DECISION_MADE)
					moverClass.Add(destination[0], destination[1]);
				if(DECISION_MADE)LOGGER("running to defense", destination[0], destination[1]);
			}


			/// STEP 3) 	 ---------------------   Heal   ---------------------------
			/// IF there is no found location
			/// respond by resting and healing

			if(!DECISION_MADE)
			{
				DECISION_MADE = BEST_HEAL_CHOICE(__game, __player, currentUnit, spaces, destination);
				if(DECISION_MADE)
					moverClass.Add(destination[0], destination[1]);
				if(DECISION_MADE)LOGGER("healing", currentUnit.X, currentUnit.Y);
			}


			/// LAST STEP) 	 ---------------------   IDLE   ---------------------------
			/// IF healing isn't an option
			/// move out of way of important moves

			if(!DECISION_MADE)
			{
				DECISION_MADE = IDLE_ROAM(__game, __player, currentUnit, spaces, destination);
				if(DECISION_MADE)
					moverClass.Add(destination[0], destination[1]);
				if(DECISION_MADE)LOGGER("idle roam", currentUnit.X, currentUnit.Y);
			}

			Prep_Movement(__game, __player, currentUnit, destination, moverClass);
			return true;
		}

		/// if it reaches this part of the code
		// then there aren't suffient units to defend the area
		// so build needed units
		// -- find next closest building, and build needed unit

		var city_amount = __player.Building_Amount(),
			active_city;

		for(var i=0;i<city_amount;i++)
		{
			active_city = __player.Get_Building(i);
			if(!active_city.Active)continue;
			if(!Within_Range(active_city, __target.X, __target.Y, range))
				continue;
			for(var j=0;j<best_choices.length;j++)
			{
				if(__player.Can_Build(best_choices[j], active_city))
				if(TRY_BUILD(__game, __player, active_city, best_choices[j]))
				{
					INTERFACE.Draw();
					if(!__game.Terrain_Map.At(active_city.X, active_city.Y).Hidden)
						INTERFACE.Scroll_To_Tile(active_city.X, active_city.Y);
					setTimeout(function(){
						INTERFACE.Draw();
						STATUS_CHOICE(Check_Standings(__player), __game, __player);
					}, TIMEOUT);
					return true;
				}
			}
		}

		active_city = __player.Next_Active_Building();
		if(active_city!=-1)
		{
			for(var j=0;j<best_choices.length;j++)
			{
				if(__player.Can_Build(best_choices[j], active_city))
				if(TRY_BUILD(__game, __player, active_city, best_choices[j]))
				{
					INTERFACE.Draw();
					if(!__game.Terrain_Map.At(active_city.X, active_city.Y).Hidden)
						INTERFACE.Scroll_To_Tile(active_city.X, active_city.Y);
					setTimeout(function(){
						INTERFACE.Draw();
						STATUS_CHOICE(Check_Standings(__player), __game, __player);
					}, TIMEOUT);
					return true;
				}
			}
		}

		return false;
	};
	var Run_Away = function(__game, aiPlayer, currentUnit)
	{	/** 1 STAR standing */
		var moverClass = new Move_Class(currentUnit,currentUnit.X,currentUnit.Y,__game.Terrain_Map,function(list){});
		currentUnit.Start_Path(currentUnit.X, currentUnit.Y, true);

		var destination = [-1, -1];
		var spaces = currentUnit.Current_Path().All_Movable_Spaces();
		var DECISION_MADE = false; // when true, stop looking for move, and go to finish

LOGGER(" ");
LOGGER("--");
LOGGER("*");
LOGGER(currentUnit.Name);


		/// STEP 1) 	 ---------------------   Capturing   ---------------------------
		/// have infantry chase and capture cities. enemy > vacant

		DECISION_MADE = TRY_CAPTURE(__game, aiPlayer, currentUnit, spaces, destination);
		if(DECISION_MADE)
			moverClass.Add(destination[0], destination[1]);
		if(DECISION_MADE)LOGGER("capture", destination[0], destination[1]);
		If_Capture_And_Should_Attack(__game, currentUnit, moverClass, destination);


		/// STEP 2) 	 ---------------------   Flee   ---------------------------
		/// IF there is no found location
		/// respond by resting and healing

		if(!DECISION_MADE)
		{	// run thru all enemy units, and flee all
			DECISION_MADE = FLEE_ENEMY(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)LOGGER("chase", destination[0], destination[1]);
		}


		/// STEP 4) 	 ---------------------   Heal   ---------------------------
		/// If closed to dying
		/// attempt to heal

		if(!DECISION_MADE)
		if(currentUnit.Health/currentUnit.Max_Health<.7)
		{
			DECISION_MADE = BEST_HEAL_CHOICE(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)LOGGER("healing", currentUnit.X, currentUnit.Y);
		}


		/// STEP 4) 	 ---------------------   Attacking   ---------------------------
		/// first things first, try to attack for most possible damage

		if(!DECISION_MADE)
		{
			DECISION_MADE = TRY_ATTACK(__game, aiPlayer, currentUnit, currentUnit.Current_Path().Attackables(), destination, moverClass);
			if(DECISION_MADE)LOGGER("atk", destination[0], destination[1]);
		}


		/// STEP 5) 	 ---------------------   Heal   ---------------------------
		/// IF there is no found location
		/// respond by resting and healing

		if(!DECISION_MADE)
		{
			DECISION_MADE = BEST_HEAL_CHOICE(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)LOGGER("healing", currentUnit.X, currentUnit.Y);
		}


		/// LAST STEP) 	 ---------------------   IDLE   ---------------------------
		/// IF healing isn't an option
		/// move out of way of important moves

		if(!DECISION_MADE)
		{
			DECISION_MADE = IDLE_ROAM(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)LOGGER("idle roam", currentUnit.X, currentUnit.Y);
		}

		Prep_Movement(__game, aiPlayer, currentUnit, destination, moverClass);
	};
	var Gather_Strength = function(__game, aiPlayer, currentUnit)
	{	/** 2 STAR standing */
		var moverClass = new Move_Class(currentUnit,currentUnit.X,currentUnit.Y,__game.Terrain_Map,function(list){});
		currentUnit.Start_Path(currentUnit.X, currentUnit.Y, true);

		var destination = [-1, -1];
		var spaces = currentUnit.Current_Path().All_Movable_Spaces();
		var DECISION_MADE = false; // when true, stop looking for move, and go to finish

LOGGER(" ");
LOGGER("--");
LOGGER("**");
LOGGER(currentUnit.Name);


		/// STEP 1) 	 ---------------------   Capturing   ---------------------------
		/// have infantry chase and capture cities. enemy > vacant

		if(!DECISION_MADE)
		{
			DECISION_MADE = TRY_CAPTURE(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)LOGGER("capture", destination[0], destination[1]);
			If_Capture_And_Should_Attack(__game, currentUnit, moverClass, destination);
		}


		/// STEP 2) 	 ---------------------   Attacking   ---------------------------
		/// first things first, try to attack for most possible damage

		if(!DECISION_MADE)
		{
			DECISION_MADE = TRY_ATTACK(__game, aiPlayer, currentUnit, currentUnit.Current_Path().Attackables(), destination, moverClass);
			if(DECISION_MADE)LOGGER("atk", destination[0], destination[1]);
		}


		/// STEP 3) 	 ---------------------   Heal   ---------------------------
		/// If closed to dying
		/// attempt to heal

		if(!DECISION_MADE)
		if(currentUnit.Health/currentUnit.Max_Health<.6)
		{
			DECISION_MADE = BEST_HEAL_CHOICE(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)LOGGER("healing", currentUnit.X, currentUnit.Y);
		}


		/// STEP 4) 	 ---------------------   Chase City   ---------------------------
		/// first things first, try to attack for most possible damage

		if(!DECISION_MADE)
		{
			DECISION_MADE = CHASE_CITY(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)LOGGER("chase city", destination[0], destination[1]);
		}


		/// STEP 5) 	 ---------------------   Heal   ---------------------------
		/// IF there is no found location
		/// respond by resting and healing

		if(!DECISION_MADE)
		{
			DECISION_MADE = BEST_HEAL_CHOICE(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)LOGGER("healing", currentUnit.X, currentUnit.Y);
		}


		/// LAST STEP) 	 ---------------------   IDLE   ---------------------------
		/// IF healing isn't an option
		/// move out of way of important moves

		if(!DECISION_MADE)
		{
			DECISION_MADE = IDLE_ROAM(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)LOGGER("idle roam", currentUnit.X, currentUnit.Y);
		}

		Prep_Movement(__game, aiPlayer, currentUnit, destination, moverClass);
	};
	var Set_Position = function(__game, aiPlayer, currentUnit)
	{	/** 3 STAR standing */
		var moverClass = new Move_Class(currentUnit,currentUnit.X,currentUnit.Y,__game.Terrain_Map,function(list){});
		currentUnit.Start_Path(currentUnit.X, currentUnit.Y, true);

		var destination = [-1, -1];
		var spaces = currentUnit.Current_Path().All_Movable_Spaces();
		var DECISION_MADE = false; // when true, stop looking for move, and go to finish

LOGGER(" ");
LOGGER("--");
LOGGER("***");
LOGGER(currentUnit.Name);


		/// STEP 1) 	 ---------------------   Capturing   ---------------------------
		/// have infantry chase and capture cities. enemy > vacant

		DECISION_MADE = TRY_CAPTURE(__game, aiPlayer, currentUnit, spaces, destination);
		if(DECISION_MADE)
			moverClass.Add(destination[0], destination[1]);
		if(DECISION_MADE)LOGGER("capture", destination[0], destination[1]);
		If_Capture_And_Should_Attack(__game, currentUnit, destination);


		/// STEP 2) 	 ---------------------   Attacking   ---------------------------
		/// first things first, try to attack for most possible damage

		if(!DECISION_MADE)
		{
			DECISION_MADE = TRY_ATTACK(__game, aiPlayer, currentUnit, currentUnit.Current_Path().Attackables(), destination, moverClass);
			if(DECISION_MADE)LOGGER("atk", destination[0], destination[1]);
		}


		/// STEP 3) 	 ---------------------   Chase City   ---------------------------
		/// first things first, try to attack for most possible damage

		if(!DECISION_MADE)
		{
			DECISION_MADE = CHASE_CITY(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)LOGGER("chase city", destination[0], destination[1]);
		}


		/// STEP 4) 	 ---------------------   Heal   ---------------------------
		/// If closed to dying
		/// attempt to heal

		if(!DECISION_MADE)
		if(currentUnit.Health/currentUnit.Max_Health<.5)
		{
			DECISION_MADE = BEST_HEAL_CHOICE(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)LOGGER("healing", currentUnit.X, currentUnit.Y);
		}


		/// Step 5) 	 ---------------------   Chase Enemy   ---------------------------
		/// move units to into an attack formation

		if(!DECISION_MADE)
		{
			DECISION_MADE = CHASE_ENEMY(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)LOGGER("chase enemy", destination[0], destination[1]);
		}


		/// STEP 6) 	 ---------------------   Heal   ---------------------------
		/// IF there is no found location
		/// respond by resting and healing

		if(!DECISION_MADE)
		{
			DECISION_MADE = BEST_HEAL_CHOICE(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)LOGGER("healing", currentUnit.X, currentUnit.Y);
		}


		/// LAST STEP) 	 ---------------------   IDLE   ---------------------------
		/// IF healing isn't an option
		/// move out of way of important moves

		if(!DECISION_MADE)
		{
			DECISION_MADE = IDLE_ROAM(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)LOGGER("idle roam", currentUnit.X, currentUnit.Y);
		}

		Prep_Movement(__game, aiPlayer, currentUnit, destination, moverClass);
	};
	var Be_Hostile = function(__game, aiPlayer, currentUnit)
	{	/** 4 STAR standing */
		var moverClass = new Move_Class(currentUnit,currentUnit.X,currentUnit.Y,__game.Terrain_Map,function(list){});
		currentUnit.Start_Path(currentUnit.X, currentUnit.Y, true);

		var destination = [-1, -1];
		var spaces = currentUnit.Current_Path().All_Movable_Spaces();
		var DECISION_MADE = false; // when true, stop looking for move, and go to finish


LOGGER(" ");
LOGGER("--");
LOGGER("****");
LOGGER(currentUnit.X, currentUnit.Y);
LOGGER(currentUnit.Name);


		/// STEP 1) 	 ---------------------   Attacking   ---------------------------
		/// first things first, try to attack for most possible damage

		DECISION_MADE = TRY_ATTACK(__game, aiPlayer, currentUnit, currentUnit.Current_Path().Attackables(), destination, moverClass);
		if(DECISION_MADE)LOGGER("attack", destination[0], destination[1]);


		/// STEP 2) 	 ---------------------   Capturing   ---------------------------
		/// have infantry chase and capture cities. enemy > vacant

		if(!DECISION_MADE)
		{
			DECISION_MADE = TRY_CAPTURE(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)LOGGER("capture", destination[0], destination[1]);
			If_Capture_And_Should_Attack(__game, currentUnit, moverClass, destination);
		}


		/// Step 3) 	 ---------------------   Chasing   ---------------------------
		/// move units to into an attack formation

		if(!DECISION_MADE)
		{	// run thru all enemy units, and chase the one that will deal most damage
			DECISION_MADE = CHASE_ENEMY(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)LOGGER("chasing", destination[0], destination[1]);
		}


		/// STEP 4) 	 ---------------------   Heal   ---------------------------
		/// IF there is no found location
		/// respond by resting and healing

		if(!DECISION_MADE)
		{
			DECISION_MADE = BEST_HEAL_CHOICE(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)LOGGER("healing", currentUnit.X, currentUnit.Y);
		}


		/// LAST STEP) 	 ---------------------   IDLE   ---------------------------
		/// IF healing isn't an option
		/// move out of way of important moves

		if(!DECISION_MADE)
		{
			DECISION_MADE = IDLE_ROAM(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)LOGGER("idle roam", currentUnit.X, currentUnit.Y);
		}

		Prep_Movement(__game, aiPlayer, currentUnit, destination, moverClass);
	};
	var Winning = function(__game, aiPlayer, currentUnit)
	{	/** 5 STAR standing */
		var moverClass = new Move_Class(currentUnit,currentUnit.X,currentUnit.Y,__game.Terrain_Map,function(list){});
		currentUnit.Start_Path(currentUnit.X, currentUnit.Y, true);

		var destination = [-1, -1];
		var spaces = currentUnit.Current_Path().All_Movable_Spaces();
		var DECISION_MADE = false; // when true, stop looking for move, and go to finish


LOGGER(" ");
LOGGER("--");
LOGGER("*****");
LOGGER(currentUnit.Name);


		/// STEP 1) 	 ---------------------   Attacking   ---------------------------
		/// first things first, try to attack for most possible damage

		DECISION_MADE = TRY_ATTACK(__game, aiPlayer, currentUnit, currentUnit.Current_Path().Attackables(), destination, moverClass);
		if(DECISION_MADE)
			moverClass.Add(destination[0], destination[1]);
		if(DECISION_MADE)LOGGER("attacking", destination[0], destination[1]);


		/// Step 2) 	 ---------------------   Chasing   ---------------------------
		/// move units to into an attack formation

		if(!DECISION_MADE)
		{	// run thru all enemy units, and chase the one that will deal most damage
			DECISION_MADE = CHASE_ENEMY(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)LOGGER("chase", destination[0], destination[1]);
		}


		/// STEP 3) 	 ---------------------   Heal   ---------------------------
		/// IF there is no found location
		/// respond by resting and healing

		if(!DECISION_MADE)
		{
			DECISION_MADE = BEST_HEAL_CHOICE(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)LOGGER("healing", currentUnit.X, currentUnit.Y);
		}


		/// LAST STEP) 	 ---------------------   IDLE   ---------------------------
		/// IF healing isn't an option
		/// move out of way of important moves

		if(!DECISION_MADE)
		{
			DECISION_MADE = IDLE_ROAM(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)LOGGER("idle roam", currentUnit.X, currentUnit.Y);
		}

		Prep_Movement(__game, aiPlayer, currentUnit, destination, moverClass);
	};

		////////////////////////////
		/** Foundation functions  */
		////////////////////////////
	var Act = function(__game, aiPlayer, currentUnit, destination, moverClass)
	{
		__game.Move(currentUnit, destination[0], destination[1], moverClass.Path(), function(__unit){
			if(__unit.Alpha.Get()!=0)
			if(!__game.Terrain_Map.At(currentUnit.X, currentUnit.Y).Hidden)
				INTERFACE.Scroll_To_Tile(currentUnit.X, currentUnit.Y);
			__unit.End_Turn();
			INTERFACE.Draw();
			setTimeout(function(){
				INTERFACE.Draw();
				STATUS_CHOICE(Check_Standings(aiPlayer), __game, aiPlayer);
			}, TIMEOUT);
			INTERFACE.Draw();
		});
	};
	var Prep_Movement = function(__game, aiPlayer, currentUnit, destination, moverClass)
	{
		INTERFACE.Draw();
		if(currentUnit.Alpha.Get()!=0)
		if(INTERFACE.isTileOnScreen(currentUnit.X, currentUnit.Y)!=0)
		{
			if(!__game.Terrain_Map.At(currentUnit.X, currentUnit.Y).Hidden)
			INTERFACE.Scroll_To_Tile(currentUnit.X, currentUnit.Y);

			setTimeout(function(){
				Act(__game, aiPlayer, currentUnit, destination, moverClass);
			}, 200);
			return;
		}
		Act(__game, aiPlayer, currentUnit, destination, moverClass);
	};
	var AttackImpact = function(attackingUnit, defendingUnit)
	{	// see how much % damage will be done
		var impact = 0; // percentage

		var defenderLeftoverHealth = defendingUnit.Health - attackingUnit.Calculate_Damage(defendingUnit);

		var defenderMaxHealth = Char_Data.CHARS[defendingUnit.Source].Max_Health;

		if(defenderLeftoverHealth<=0)
		{
			impact = 1;
		}
		else
		{
			impact = 1 - (defenderLeftoverHealth / defenderMaxHealth);
		}

		return impact;
	};
	var ReturnFireImpact = function(attackingUnit, defendingUnit)
	{	// see how much % damage will be done in return
		var impact = 0; // percentage

		var defenderLeftoverHealth = defendingUnit.Health - attackingUnit.Calculate_Damage(defendingUnit);

		if(defenderLeftoverHealth<0)return impact;

		var defenderMaxHealth = Char_Data.CHARS[defendingUnit.Source].Max_Health;

		var defenderAfterAtk = defendingUnit.Clone(FAKE_GAME);

		defenderAfterAtk.Health = defenderLeftoverHealth;

		var returnAttack = attackingUnit.Health - defenderAfterAtk.Calculate_Damage(attackingUnit);

		if(returnAttack<=0)
		{
			impact = 1;
		}
		else
		{
			impact = 1 - (returnAttack / Char_Data.CHARS[attackingUnit.Source].Max_Health);
		}

		return impact;
	};
	var Within_Range = function(target, x, y, range)
	{
			var dis = Math.abs(target.X-x)+Math.abs(target.Y-y);
			return dis<=range;
	};
	var Refresh_Visible_Enemies = function(__player)
	{
		if(!Fog_Check)return;
		Visible_Enemies = __player.Game.Collect_Visible_Enemies(__player);
		Estimated_Enemies = [];
		if(Visible_Enemies.length==0)
		{	// can't see any enemies
			let p, p_amt = __player.Game.Total_Players();

			for(let i=0;i<p_amt;i++)
			{	// check each enemy player to estimate enemy locations
				p = __player.Game.Player(i);
				if(p==__player)continue;

				let capital_found = false;
				let b, amt = p.Building_Amount();
				for(let j=0;j<amt;j++)
				{
					b = p.Get_Building(j);
					if(b.Source==1)
					{
						capital_found = true;
						break;
					}
				}
				if(capital_found)
				{	// only estimate if a known capital doesn't exist
					continue;
				}

				capital_found = false;
				amt = p.Units_Amount();
				for(let j=0;j<amt;j++)
				{	// estimate each capital enemy location -> with fake unit with location near known location
					b = p.Get_Unit(j);
					if(b.Source==12)
					{	// captial unit -> Warmachine
						capital_found = true;
						let guessed_captial = new Characters.Char_Class(__player.Game, 12);
						guessed_captial.Fake_Unit = true;

						let n, range = Core.Target.Diamond(3);
						let hitrandom = Math.round(Math.random()*range.length);
						for(n=range.length-1;n>0;n--)
						{	// start far away and get closer as the AI deduces where the capital unit can be
							if(n<hitrandom)
							{	// find first location that could be possible
								if(__player.Game.Terrain_Map.At(b.X+range[n][0], b.Y+range[n][1])==null)continue;
								if(b.Calculate_Move_Cost(__player.Game.Terrain_Map.At(b.X+range[n][0], b.Y+range[n][1]))<b.Movement)
								{	// possible location
									break;
								}
							}
						}
						guessed_captial.X = b.X+range[n][0];
						guessed_captial.Y = b.Y+range[n][1];

						Estimated_Enemies.push(guessed_captial);
					}
				}

				if(!capital_found)
				{
					LOGGER("WARN: The AI could not find any units to estimate.");
				}
			}
		}
	};
	var Sort_Units_By_Expense = function(unit_list)
	{
		const quickSort = arr => {
			if (arr.length < 2) return arr;

			const pivot = Char_Data.CHARS[arr[Math.floor(Math.random() * arr.length)]].Cost;

			let left = [];
			let equal = [];
			let right = [];

			for (let element of arr) {
				let value = Char_Data.CHARS[element].Cost;
				if (value < pivot) right.push(element);
				else if (value > pivot) left.push(element);
				else equal.push(element);
			}

			return quickSort(left)
				.concat(equal)
				.concat(quickSort(right));
		};

		return quickSort(unit_list);
	};
	var If_Capture_And_Should_Attack = function(game, unit, dest)
	{
		var best_atk = 0.6, // do not want to attack if it will hurt itself over this percentage
			test_atk;
		var enemy_unit = game.Units_Map.At(dest[0]+1, dest[1]);
		if(enemy_unit!=null)
		if(enemy_unit.Player!=unit.Player)
		{
			test_atk = ReturnFireImpact(unit, enemy_unit);
			if(test_atk<best_atk)
			{
				dest[0]++;
				best_atk = test_atk;
				return;
			}
		}
		enemy_unit = game.Units_Map.At(dest[0]-1, dest[1]);
		if(enemy_unit!=null)
		if(enemy_unit.Player!=unit.Player)
		{
			test_atk = ReturnFireImpact(unit, enemy_unit);
			if(test_atk<best_atk)
			{
				dest[0]--;
				best_atk = test_atk;
				return;
			}
		}
		enemy_unit = game.Units_Map.At(dest[0], dest[1]+1);
		if(enemy_unit!=null)
		if(enemy_unit.Player!=unit.Player)
		{
			test_atk = ReturnFireImpact(unit, enemy_unit);
			if(test_atk<best_atk)
			{
				dest[1]++;
				best_atk = test_atk;
				return;
			}
		}
		enemy_unit = game.Units_Map.At(dest[0], dest[1]-1);
		if(enemy_unit!=null)
		if(enemy_unit.Player!=unit.Player)
		{
			test_atk = ReturnFireImpact(unit, enemy_unit);
			if(test_atk<best_atk)
			{
				dest[1]--;
				best_atk = test_atk;
				return;
			}
		}
	};
	var Check_Standings = function(aiPlayer)
	{
		return Math.round(aiPlayer.Check_Standing());
	};

		///////////////////////////////////////////////
		/** Main function that runs a whole AI turn  */
		///////////////////////////////////////////////
	self.Solve = function(__game, aiPlayer)
	{
		FAKE_GAME = __game.Clone();
		Fog_Check = __game.Weather[0];
		__current_player_data = aiPlayer;
		if(!aiPlayer.Active)return;
		Recursion_Break = 50;
		Last_Attempted = null;
		var aiState = Check_Standings(aiPlayer);
		if(aiState==STATE.Setup)
		{
			LOGGER(" ");
			LOGGER("+++++++");
			LOGGER(aiPlayer.Team,"Find Position");
			LOGGER(" ");
		}
		else if(aiState==STATE.Argo)
		{
			LOGGER(" ");
			LOGGER("+++++++");
			LOGGER(aiPlayer.Team,"Argressive");
			LOGGER(" ");
		}
		else if(aiState==STATE.Gathering)
		{
			LOGGER(" ");
			LOGGER("+++++++");
			LOGGER(aiPlayer.Team,"Gathering");
			LOGGER(" ");
		}
		else if(aiState==STATE.Domination)
		{
			LOGGER(" ");
			LOGGER("+++++++");
			LOGGER(aiPlayer.Team,"Winning");
			LOGGER(" ");
		}
		else if(aiState==STATE.Scared)
		{
			LOGGER(" ");
			LOGGER("+++++++");
			LOGGER(aiPlayer.Team,"Scared");
			LOGGER(" ");
		}

		try {
			STATUS_CHOICE(aiState, __game, aiPlayer);
		} catch (e) {
			LOGGER("ERROR, something broke the AI calculations here");
			aiPlayer.End_Turn();
		}
	};

			//** This executes the move queue and figures out the AI players standing in the gamestate **//
		var move_queue = new Array();
		var Do_Move_Queue = function(__game, _move)
		{	/// run current move in the fake game
			// __game.Move(_move[0], _move[1], _move[2], _move[3], _move[4]);
		};
		var Consider_Endstate_Standing = function(__game, __move_queue)
		{	/// run thru each move and end by calculating ai player standing in gamestate
			for(var i in __move_queue)
			{
				Do_Move_Queue(__game, __move_queue[i]);
			}
			return [__current_player_data.Check_Standings(), __move_queue];
		};

			//** This is used to exit out of the recursion **//
		self.Return = function()
		{
			return Consider_Endstate_Standing(FAKE_GAME, move_queue);
		};
	};

var AI = new AI_Class();
