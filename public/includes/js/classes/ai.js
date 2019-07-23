var AI = {
	STATE:{
		Scared:0,
		Gathering:1,
		Setup:2,
		Argo:3,
		Domination:4
	},
	TIMEOUT:735,
	FAKE_GAME:new Engine_Class(),
	Fog_Check:false,
	Visible_Enemies:null,
	Recursion_Break:50,
	Last_Attempted:null,
	STATUS_CHOICE:function(standing, __game, __player)
	{
		if(__game.Game_Over)return; // game over
		if(!__player.Active)return; // not __player's turn
		
		AI.Refresh_Visible_Enemies(__player);
		
		
		/// PREP 1) 	 ---------------------   Defend Capitals   ---------------------------
		/// check if main facilities are being attacked
		/// if there's any danger, instantly react
		
		var _amt = __player.Building_Amount(),
			_check_;
		for(var i=0;i<_amt;i++)
		{
			_check_ = __player.Get_Building(i);
			if(_check_.Source==1)
			if(AI.CITY_IS_THREATENED(__game, _check_, 6))
			{
				if(AI.Defend_Target(__game, __player, _check_, 6))
					return;
			}
		}
		_amt = __player.Total_Units();
		for(var i=0;i<_amt;i++)
		{
			_check_ = __player.Get_Unit(i);
			if(_check_.Source==12)
			if(AI.UNIT_IS_THREATENED(__game, _check_, 6))
			{
				if(AI.Defend_Target(__game, __player, _check_, 6))
					return;
			}
		}
		
		var __unit = AI.HEALTHIEST_ACTIVE_UNIT(__player);
		
			// stops accidental infinite loops
		if(AI.Last_Attempted==__unit)
		{
			if(--AI.Recursion_Break==0)
			{	// exit infinite loop
				console.error("Infinite loop found in AI Solution");
				__player.End_Turn();
				return;
			}
		}else AI.Recursion_Break = 50;
		AI.Last_Attempted = __unit;
		
		
		/// PREP 2) 	 ---------------------   Build   ---------------------------
		/// check if main facilities are being attacked
		/// if there's any danger, instantly react
		
		if(!~__unit || __unit==null)
		{ // if ai player has no more units to move, then build / act buildings
			let _special_unit = __player.Next_Active_Unit();
			if(_special_unit!=null)
			{
				AI.Manuver_Capital_Unit(standing, __game, __player, _special_unit);
				return;
			}
	
			var __city = __player.Next_Active_Building();
			if(!~__city)return;
			
			if(!AI.TRY_BUILD(__game, __player, __city, null, function(_cur_city){
				__game.Interface.Draw();
				setTimeout(function(){
					__game.Interface.Draw();
					AI.STATUS_CHOICE(AI.Check_Standings(__player), __game, __player);
				}, AI.TIMEOUT);
			}))
				__city.End_Turn();
			return;
		}

		
		
		/// PREP 3) 	 ---------------------   Regular Decision Making   ---------------------------
		/// depending on the status of the ai player, vs all the opponents,
		/// respond in the best tactical way
		
		if(standing==AI.STATE.Setup)
		{
			AI.Set_Position(__game, __player, __unit);
		}
		else if(standing==AI.STATE.Argo)
		{
			AI.Be_Hostile(__game, __player, __unit);
		}
		else if(standing==AI.STATE.Gathering)
		{
			AI.Gather_Strength(__game, __player, __unit);
		}
		else if(standing==AI.STATE.Domination)
		{
			AI.Winning(__game, __player, __unit);
		}
		else if(standing==AI.STATE.Scared)
		{
			AI.Run_Away(__game, __player, __unit);
		}
		else
		{
			console.error("no standing data, could not figure out what to do");
			__player.End_Turn();
		}
	},

	Path_Find:function(mapHandler, unit, start, end, attacking, cantCrossEnemy)
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
// console.log(myNode.value === mypathEnd.value);
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
// console.log(result);
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
// console.log("values",Closed[asCheck].value,myPath.value);
// console.log("checking",myPath.x,myPath.y);
// console.log("asCheck",asCheck);
// console.log("VALUE",Closed[asCheck].Parent);
								if (Closed[asCheck].Parent!=undefined)
								{
// console.log(Closed[asCheck]);
// console.log(myNode);
									if(Closed[asCheck].Parent.totalMovementCost>myNode.totalMovementCost)
									{	// if we found a cheaper route, add this route to the list!
// console.log(Closed[asCheck].Parent.totalMovementCost,"is LARGER than",myNode.totalMovementCost);
										AStar[myPath.value] = false;
// console.log("Current");
// console.log(myPath);
// console.log("Old");
// console.log(Closed[asCheck]);
										break;
									}
// console.log(Closed[asCheck].Parent.totalMovementCost,"is cheaper than",myNode.totalMovementCost);
								}
							}
						}
					}
					
					if (!AStar[myPath.value])
					{
// console.log("AStar",myPath.x,myPath.y);
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
// console.log(result);
			
			return result;
		}

		// actually calculate the a-star path!
		// this returns an array of coordinates
		// that is empty if no path is possible
		return calculatePath();
	},

	DECISION:function(weights)
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
	},
	CLOSEST_REACHABLE_SPOT:function(__game, __unit, _x, _y)
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
			if(city.Active)continue;
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
	},

	// TO DO 
	// IF ACTIVE PLAYER UNIT IN WAY OF GOOD SPOT,
	// CALL TO MOVE THAT GUY, THEN GO BACK TO FINISH
	// FIGURING OUT PREVIOUS UNIT MOVE (newly opened destination)
	
		////////////////////////
		/** Helper functions  */
		////////////////////////
	ENEMY_AVERAGE_ARMOR:function(__game, attacker)
	{
		var types = new Array(Char_Data.ArmorToStr.length);
		var best = 0;
		
		
		for(var i=0;i<__game.Total_Players();i++)
		{
			var player = __game.Player(i);
			if(player==attacker)continue;
			for(var j=0;j<player.Total_Units();j++)
				types[player.Get_Unit(j).Armor]++;
		}
		
		for(var i=1;i<types.length;i++)
		{
			if(types[best]<types[i])
				best = i;
		}
		
		return best;
	},
	BEST_WEAPON_TYPE:function(armor)
	{
		if(armor==0)
			return 0;
		if(armor==2)
			return 2;
		return 1;
	},
	CAN_CAPTURE:function(__unit)
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
	},
	UNIT_IS_THREATENED:function(__game, __unit, range)
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
			if(AI.Within_Range(checked_unit, __unit.X, __unit.Y, range-2))
			{
				defenders++;
				continue;
			}
			if(checked_unit.Alpha.Get()<255)continue;
			if(AI.Visible_Enemies!=null)
			if(!AI.Visible_Enemies.includes(checked_unit))continue;
			if(AI.Within_Range(checked_unit, __unit.X, __unit.Y, range))
				attackers++;
		}
		
		return (attackers >= defenders);
	},
	CITY_IS_THREATENED:function(__game, __city, range)
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
				if(AI.Within_Range(checked_unit, __city.X, __city.Y, range-2))
					defenders++;
				continue;
			}
			if(checked_unit.Alpha.Get()<255)continue;
			if(AI.Visible_Enemies!=null)
			if(!AI.Visible_Enemies.includes(checked_unit))continue;
			if(!AI.Within_Range(checked_unit, __city.X, __city.Y, range))continue;
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
	},
	TERRAIN_IS_DEFENDED:function(__game, __player, __terrain, range)
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
				if(AI.Within_Range(checked_unit, __terrain.X, __terrain.Y, range-2))
					defenders++;
				continue;
			}
			if(checked_unit.Alpha.Get()<255)continue;
			if(AI.Visible_Enemies!=null)
			if(!AI.Visible_Enemies.includes(checked_unit))continue;
			if(!AI.Within_Range(checked_unit, __terrain.X, __terrain.Y, range))continue;
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
	},
	GET_ENEMIES_IN_AREA:function(__game, __player, center_x, center_y, range)
	{	/** Returns a list of enemies in the specified area */
		var checked_unit,
			units_amt = __game.Unit_Amount();
		var _enemies = [];
		
		for(var i=0;i<units_amt;i++)
		{
			checked_unit = __game.Get_Unit(i);
			if(AI.Visible_Enemies!=null)
			if(!AI.Visible_Enemies.includes(checked_unit))continue;
			if(checked_unit.Player!=__player)
			if(checked_unit.Alpha.Get()==255)
			if(AI.Within_Range(checked_unit, center_x, center_y, range))
			{
				_enemies.push(checked_unit);
			}
		}
		
		return _enemies;
	},
	BEST_DEFENSE_BY_AREA:function(__game, __player, center_x, center_y, range)
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
			if(AI.Within_Range(checked_unit, center_x, center_y, range))
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
	},
	BEST_BUILD_CHOICE:function(__game, __player, __resources, __loc_type)
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
				var total = __game.Player(j).Total_Units();
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
				var units = __player.Total_Units();
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
		
		var bestWeapon = AI.BEST_WEAPON_TYPE(AI.ENEMY_AVERAGE_ARMOR(__game, __player));
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
	},
	FIND_BEST_CHASE:function(__game, __player, __unit, spaces, destination, route)
	{	/** Find the route to go towards the destination */
		var DECISION_MADE = true;
		
		if(route==null)
			route = new AI.Path_Find(__game.Terrain_Map, __unit, [__unit.X, __unit.Y], [destination[0], destination[1]]);
		
		var _x = -1,
			_y = -1,
			move = __unit.Movement+1;
		
		for(var i=0;i<route.length;i++)
		{	// finds closest non occupied chase path
			var terrain_type = __game.Terrain_Map.At(route[i][0], route[i][1]);
			move-=__unit.Calculate_Move_Cost(terrain_type);
			if(move<0)
			{
				if(terrain_type.Building==null)
				{
					if(__game.Units_Map.At(_x, _y)!=null)
					{
						var result = AI.CLOSEST_REACHABLE_SPOT(__game, __unit, _x, _y);
						_x = result[0];
						_y = result[1];
					}
					
				}
				else if(terrain_type.Building.Active ||
					__game.Units_Map.At(_x, _y)!=null)
				{
					var result = AI.CLOSEST_REACHABLE_SPOT(__game, __unit, _x, _y);
					_x = result[0];
					_y = result[1];
				}
				break;
			}
			_x = route[i][0];
			_y = route[i][1];
		}
		
		if(_x!=-1 && _y!=-1)
		{	// found a good path to travel
			destination[0] = _x;
			destination[1] = _y;
		}	// otherwise, can't travel because path is too populated
		
		return DECISION_MADE;
	},
	BEST_HEAL_CHOICE:function(__game, __player, __unit, spaces, destination)
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
				unit.Repair();
				break;
			}
		}
		
		return DECISION_MADE;
	},
	HEALTHIEST_ACTIVE_UNIT:function(player)
	{	/** Uses strongest units first, and ranomizes near-similar choices */
		var all_units = [],
			all_choices = [];
		var armySize = player.Total_Units();
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

		var best_unit = all_units[AI.DECISION(all_choices)];
		
		return best_unit;
	},
	
	
		/////////////////////////////
		/** Unit Specific Actions  */
		/////////////////////////////
	TRY_BUILD:function(__game, __player, __city, unit_index, callback)
	{	/** If city can create a new unit, build the best one */
		if(unit_index==null)
			unit_index = AI.BEST_BUILD_CHOICE(__game, __player, __player.Cash_Money(), __city.Terrain.Type);
		
		if(unit_index!=null)
		{
			if(__game.Build(__city, unit_index, callback))
			{
				if(online)socket.emit('send build', __city.Index, unit_index);
				INTERFACE.Scroll_To_Tile(__city.X, __city.Y);
				if(callback!=null)callback();
				return true;
			}
		}
		if(callback!=null)callback();
		return false;
	},
	TRY_CAPTURE:function(__game, __player, __unit, spaces, destination)
	{	/** If city in range, run to capture best choice */
		var DECISION_MADE = false;
		
		if(!AI.CAN_CAPTURE(__unit))return DECISION_MADE;
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
	},
	TRY_ATTACK:function(__game, __player, __unit, spaces, destination, moverClass)
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
			if(AI.Visible_Enemies!=null)
			if(!AI.Visible_Enemies.includes(checkingEnemyUnit))continue;
		
			var attack_value = AI.AttackImpact(__unit, checkingEnemyUnit);
			if(attack_value+0.2<AI.ReturnFireImpact(__unit, checkingEnemyUnit))continue;
			
			all_choices.push(attack_value);
			all_enemy.push(checkingEnemyUnit);
			DECISION_MADE = true;
		}
		if(DECISION_MADE)
		{
			var choice = all_enemy[AI.DECISION(all_choices)];
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
	},
	TRY_ATTACK_UNITS:function(__game, __player, __unit, spaces, destination, moverClass, target_list)
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
		
			var attack_value = AI.AttackImpact(__unit, checkingEnemyUnit);
			if(attack_value+0.2<AI.ReturnFireImpact(__unit, checkingEnemyUnit))continue;
			
			all_choices.push(attack_value);
			all_enemy.push(checkingEnemyUnit);
			DECISION_MADE = true;
		}
		if(DECISION_MADE)
		{
			var choice = all_enemy[AI.DECISION(all_choices)];
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
	},
	TARGET_LOC:function(__game, __player, __unit, spaces, destination, __target_source)
	{	/** Runs directly to location, unless it's unreachable */
		if(__unit.Movement==0)return false;
			// if can't move, stop considering this
			
		destination[0] = __target_source.X;
		destination[1] = __target_source.Y;
		
		return AI.FIND_BEST_CHASE(__game, __player, __unit, spaces, destination);
	},
	CHASE_CITY:function(__game, __player, __unit, spaces, destination)
	{	/** Chases fastest capturable city */
		var DECISION_MADE = false;
		
		// if can't capture, stop considering this
		if(!AI.CAN_CAPTURE(__unit))return DECISION_MADE;
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
				checked_path = AI.Path_Find(__game.Terrain_Map, __unit, [__unit.X, __unit.Y], [checkCaptureCity.X, checkCaptureCity.Y], false, true);
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
				checked_path = AI.Path_Find(__game.Terrain_Map, __unit, [__unit.X, __unit.Y], [checkCaptureCity.X, checkCaptureCity.Y], false, true);
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
			DECISION_MADE = AI.FIND_BEST_CHASE(__game, __player, __unit, spaces, destination, best_path);
		}
		
		return DECISION_MADE;
	},
	CHASE_ENEMY:function(__game, __player, __unit, spaces, destination)
	{	/** Check enemy units, and chase the one that will deal most damage */
		var DECISION_MADE = false;
		
		// if can't move, stop considering this
		if(__unit.Movement==0)return DECISION_MADE;
		
		var checkingEnemyUnit,
			checkingEnemyPlayer,
			bestChoiceImpact;
		var best_path,checked_path;
			
		for(var i=0;i<__game.Total_Players();i++)
		{
			checkingEnemyPlayer = __game.Player(i);
			if(checkingEnemyPlayer==null)continue;
			if(checkingEnemyPlayer.Team==__player.Team)continue;
				// same team
			
			// run thru current enemy player's units
			for(var j=0;j<checkingEnemyPlayer.Total_Units();j++)
			{
				checkingEnemyUnit = checkingEnemyPlayer.Get_Unit(j);
				if(checkingEnemyUnit==null)continue;
				if(!__unit.Can_Attack(checkingEnemyUnit))continue;
				if(checkingEnemyUnit.Alpha.Get()<255)continue;
				if(AI.Visible_Enemies!=null)
				if(!AI.Visible_Enemies.includes(checkingEnemyUnit))continue;
				
				checkingAttackImpact = AI.AttackImpact(__unit, checkingEnemyUnit);
				// now check if its best choice
				if(!DECISION_MADE)
				{
					// checked_path = AI.Path_Find(__game.Terrain_Map, __unit, [__unit.X, __unit.Y], [checkingEnemyUnit.X, checkingEnemyUnit.Y], false, true);
					checked_path = AI.Path_Find(__game.Terrain_Map, __unit, [__unit.X, __unit.Y], [checkingEnemyUnit.X, checkingEnemyUnit.Y], false, false);
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
					checked_path = AI.Path_Find(__game.Terrain_Map, __unit, [__unit.X, __unit.Y], [checkingEnemyUnit.X, checkingEnemyUnit.Y], false, true);
					if(checked_path.length==0)
						continue; // if cannot reach, dont try
					if(AI.ReturnFireImpact(__unit, checkingEnemyUnit)>checkingAttackImpact)continue;
					destination[0] = checkingEnemyUnit.X;
					destination[1] = checkingEnemyUnit.Y;
					bestChoiceImpact = checkingAttackImpact;
					best_path = checked_path;
				}
			}
		}
		if(DECISION_MADE)
		{	// since it found the best choice to chase
			// now it can get the closest it can to it
			DECISION_MADE = AI.FIND_BEST_CHASE(__game, __player, __unit, spaces, destination, best_path);
		}
		
		return DECISION_MADE;
	},
	FLEE_ENEMY:function(__game, __player, __unit, spaces, destination)
	{	/** is not implemented */
		return AI.BEST_HEAL_CHOICE(__game, __player, __unit, spaces, destination);
	},
	IDLE_ROAM:function(__game, __player, __unit, spaces, destination)
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
			var choice = all_choices[AI.DECISION(all_weights)];
			
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
	},

		
		///////////////////////////////////////////////////////////
		/// These will recur until all units and tasks are done ///
		///////////////////////////////////////////////////////////
		////// depending on how well the ai player is doing, //////
		////// the order in which the above techniques ////////////
		////// will be consider and done. /////////////////////////
		///////////////////////////////////////////////////////////
		
	Manuver_Capital_Unit:function(__standing, __game, __player, __unit)
	{	/** To handle how a capital unit will act */
console.log(" ");
console.log("--");
console.log("standing",__standing);
console.log(__unit.Name);

			// only build sea units if on a Shore
		let choice = AI.BEST_BUILD_CHOICE(__game, __player, __unit.Cash, (__game.Terrain_Map.At(__unit.X, __unit.Y).Source==Terrain_Data.Get("Shore")) ? null : 0);

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
				if(!AI.TERRAIN_IS_DEFENDED(__game, __player, t, 4))
				{	// now move to it
					var moverClass = new Move_Class(__unit,__unit.X,__unit.Y,__game.Terrain_Map,function(list){});
					__unit.Start_Path(__unit.X, __unit.Y, true);
					
					console.log("ITS IN");
					
					var destination = [-1, -1];
					var spaces = __unit.Current_Path().All_Movable_Spaces();
					if(AI.TARGET_LOC(__game, __player, __unit, spaces, destination, t))
					{	// if it can make it to that location
						moverClass.Add(destination[0], destination[1]);
						console.log("chasing ore deposit", destination[0], destination[1]);
					
						AI.Prep_Movement(__game, __player, __unit, destination, moverClass);
						return true;
					}
				}
			}
			// could not find a good place to go
			__unit.End_Turn();
			setTimeout(function(){
				__game.Interface.Draw();
				AI.STATUS_CHOICE(AI.Check_Standings(__player), __game, __player);
			}, AI.TIMEOUT);
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
			
			INTERFACE.Scroll_To_Tile(__unit.X, __unit.Y);
			
			SFXs.Retrieve("build").Play();
			__unit.Cash-=__player.Calculate_Cost(choice);
			new_unit.Alpha.data = 0;
			new_unit.Idle = true;
			new_unit.Set_Active(false);
			__game.Add_Unit(new_unit, loc_x, loc_y, __player.Team);
			__unit.End_Turn();
			Core.Fade_Drawable(new_unit, 255, 7);
			
			setTimeout(function(){
				__game.Interface.Draw();
				AI.STATUS_CHOICE(AI.Check_Standings(__player), __game, __player);
			}, AI.TIMEOUT);
			return;
		}
		
		// if can't build what want to build
		// dig for resources
		// if no resources below Warmachine
		// run to closest terrain with Resources
		// unless terrain is guarded (too many enemies within 5 spaces)
		
		__unit.End_Turn();
		return;
	},
	Defend_Target:function(__game, __player, __target, range)
	{	/** Prioritize units to defend or run to specific target within range */
		var DECISION_MADE = false; // when true, stop looking for move, and go to finish

console.log(" ");
console.log("!!!");
console.log("DEFEND TARGET");
console.log(__target.Name);
console.log(__target.X, __target.Y);

	
		var total_units = __player.Total_Units(),
			currentUnit,
			_enemies = AI.GET_ENEMIES_IN_AREA(__game, __player, __target.X, __target.Y, range);
		var best_choices = AI.BEST_DEFENSE_BY_AREA(__game, __player, __target.X, __target.Y, range);
		if(best_choices==-1)return;
			// no enemies in area
		
		best_choices = AI.Sort_Units_By_Expense(best_choices);
		
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
			
			DECISION_MADE = AI.TRY_ATTACK_UNITS(__game, __player, currentUnit, currentUnit.Current_Path().Attackables(), destination, moverClass, _enemies);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)console.log("defending", destination[0], destination[1]);

			
			/// STEP 2) 	 ---------------------   Chase City   ---------------------------
			/// send helpful unit to the defense

			if(!DECISION_MADE)
			{
				DECISION_MADE = AI.TARGET_LOC(__game, __player, currentUnit, spaces, destination, __target);
				if(DECISION_MADE)
					moverClass.Add(destination[0], destination[1]);
				if(DECISION_MADE)console.log("running to defense", destination[0], destination[1]);
			}

		
			/// STEP 3) 	 ---------------------   Heal   ---------------------------
			/// IF there is no found location
			/// respond by resting and healing
			
			if(!DECISION_MADE)
			{
				DECISION_MADE = AI.BEST_HEAL_CHOICE(__game, __player, currentUnit, spaces, destination);
				if(DECISION_MADE)
					moverClass.Add(destination[0], destination[1]);
				if(DECISION_MADE)console.log("healing", currentUnit.X, currentUnit.Y);
			}
			

			/// LAST STEP) 	 ---------------------   IDLE   ---------------------------
			/// IF healing isn't an option
			/// move out of way of important moves
			
			if(!DECISION_MADE)
			{
				DECISION_MADE = AI.IDLE_ROAM(__game, __player, currentUnit, spaces, destination);
				if(DECISION_MADE)
					moverClass.Add(destination[0], destination[1]);
				if(DECISION_MADE)console.log("idle roam", currentUnit.X, currentUnit.Y);
			}
			
			AI.Prep_Movement(__game, __player, currentUnit, destination, moverClass);
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
			if(!AI.Within_Range(active_city, __target.X, __target.Y, range))
				continue;
			for(var j=0;j<best_choices.length;j++)
			{
				if(__player.Can_Build(best_choices[j], active_city))
				if(AI.TRY_BUILD(__game, __player, active_city, best_choices[j]))
				{
					__game.Interface.Draw();
					setTimeout(function(){
						__game.Interface.Draw();
						AI.STATUS_CHOICE(AI.Check_Standings(__player), __game, __player);
					}, AI.TIMEOUT);
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
				if(AI.TRY_BUILD(__game, __player, active_city, best_choices[j]))
				{
					__game.Interface.Draw();
					setTimeout(function(){
						__game.Interface.Draw();
						AI.STATUS_CHOICE(AI.Check_Standings(__player), __game, __player);
					}, AI.TIMEOUT);
					return true;
				}
			}
		}
		
		return false;
	},
	Run_Away:function(__game, aiPlayer, currentUnit)
	{	/** 1 STAR standing */
		var moverClass = new Move_Class(currentUnit,currentUnit.X,currentUnit.Y,__game.Terrain_Map,function(list){});
		currentUnit.Start_Path(currentUnit.X, currentUnit.Y, true);
		
		var destination = [-1, -1];
		var spaces = currentUnit.Current_Path().All_Movable_Spaces();
		var DECISION_MADE = false; // when true, stop looking for move, and go to finish

console.log(" ");
console.log("--");
console.log("*");
console.log(currentUnit.Name);

		
		/// STEP 1) 	 ---------------------   Capturing   ---------------------------
		/// have infantry chase and capture cities. enemy > vacant
		
		DECISION_MADE = AI.TRY_CAPTURE(__game, aiPlayer, currentUnit, spaces, destination);
		if(DECISION_MADE)
			moverClass.Add(destination[0], destination[1]);
		if(DECISION_MADE)console.log("capture", destination[0], destination[1]);
		AI.If_Capture_And_Should_Attack(__game, currentUnit, moverClass, destination);


		/// STEP 2) 	 ---------------------   Flee   ---------------------------
		/// IF there is no found location
		/// respond by resting and healing
		
		if(!DECISION_MADE)
		{	// run thru all enemy units, and flee all
			DECISION_MADE = AI.FLEE_ENEMY(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)console.log("chase", destination[0], destination[1]);
		}
		

		/// STEP 4) 	 ---------------------   Heal   ---------------------------
		/// If closed to dying
		/// attempt to heal
		
		if(!DECISION_MADE)
		if(currentUnit.Health/currentUnit.Max_Health<.7)
		{
			DECISION_MADE = AI.BEST_HEAL_CHOICE(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)console.log("healing", currentUnit.X, currentUnit.Y);
		}


		/// STEP 4) 	 ---------------------   Attacking   ---------------------------
		/// first things first, try to attack for most possible damage

		if(!DECISION_MADE)
		{
			DECISION_MADE = AI.TRY_ATTACK(__game, aiPlayer, currentUnit, currentUnit.Current_Path().Attackables(), destination, moverClass);
			if(DECISION_MADE)console.log("atk", destination[0], destination[1]);
		}
		
		
		/// STEP 5) 	 ---------------------   Heal   ---------------------------
		/// IF there is no found location
		/// respond by resting and healing
		
		if(!DECISION_MADE)
		{
			DECISION_MADE = AI.BEST_HEAL_CHOICE(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)console.log("healing", currentUnit.X, currentUnit.Y);
		}
		

		/// LAST STEP) 	 ---------------------   IDLE   ---------------------------
		/// IF healing isn't an option
		/// move out of way of important moves
		
		if(!DECISION_MADE)
		{
			DECISION_MADE = AI.IDLE_ROAM(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)console.log("idle roam", currentUnit.X, currentUnit.Y);
		}
		
		AI.Prep_Movement(__game, aiPlayer, currentUnit, destination, moverClass);
	},
	Gather_Strength:function(__game, aiPlayer, currentUnit)
	{	/** 2 STAR standing */
		var moverClass = new Move_Class(currentUnit,currentUnit.X,currentUnit.Y,__game.Terrain_Map,function(list){});
		currentUnit.Start_Path(currentUnit.X, currentUnit.Y, true);
		
		var destination = [-1, -1];
		var spaces = currentUnit.Current_Path().All_Movable_Spaces();
		var DECISION_MADE = false; // when true, stop looking for move, and go to finish

console.log(" ");
console.log("--");
console.log("**");
console.log(currentUnit.Name);

		
		/// STEP 1) 	 ---------------------   Capturing   ---------------------------
		/// have infantry chase and capture cities. enemy > vacant
		
		if(!DECISION_MADE)
		{
			DECISION_MADE = AI.TRY_CAPTURE(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)console.log("capture", destination[0], destination[1]);
			AI.If_Capture_And_Should_Attack(__game, currentUnit, moverClass, destination);
		}


		/// STEP 2) 	 ---------------------   Attacking   ---------------------------
		/// first things first, try to attack for most possible damage

		if(!DECISION_MADE)
		{
			DECISION_MADE = AI.TRY_ATTACK(__game, aiPlayer, currentUnit, currentUnit.Current_Path().Attackables(), destination, moverClass);
			if(DECISION_MADE)console.log("atk", destination[0], destination[1]);
		}


		/// STEP 3) 	 ---------------------   Heal   ---------------------------
		/// If closed to dying
		/// attempt to heal
		
		if(!DECISION_MADE)
		if(currentUnit.Health/currentUnit.Max_Health<.6)
		{
			DECISION_MADE = AI.BEST_HEAL_CHOICE(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)console.log("healing", currentUnit.X, currentUnit.Y);
		}
		

		/// STEP 4) 	 ---------------------   Chase City   ---------------------------
		/// first things first, try to attack for most possible damage

		if(!DECISION_MADE)
		{
			DECISION_MADE = AI.CHASE_CITY(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)console.log("chase city", destination[0], destination[1]);
		}


		/// STEP 5) 	 ---------------------   Heal   ---------------------------
		/// IF there is no found location
		/// respond by resting and healing
		
		if(!DECISION_MADE)
		{
			DECISION_MADE = AI.BEST_HEAL_CHOICE(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)console.log("healing", currentUnit.X, currentUnit.Y);
		}
		

		/// LAST STEP) 	 ---------------------   IDLE   ---------------------------
		/// IF healing isn't an option
		/// move out of way of important moves
		
		if(!DECISION_MADE)
		{
			DECISION_MADE = AI.IDLE_ROAM(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)console.log("idle roam", currentUnit.X, currentUnit.Y);
		}
		
		AI.Prep_Movement(__game, aiPlayer, currentUnit, destination, moverClass);
	},
	Set_Position:function(__game, aiPlayer, currentUnit)
	{	/** 3 STAR standing */
		var moverClass = new Move_Class(currentUnit,currentUnit.X,currentUnit.Y,__game.Terrain_Map,function(list){});
		currentUnit.Start_Path(currentUnit.X, currentUnit.Y, true);
		
		var destination = [-1, -1];
		var spaces = currentUnit.Current_Path().All_Movable_Spaces();
		var DECISION_MADE = false; // when true, stop looking for move, and go to finish

console.log(" ");
console.log("--");
console.log("***");
console.log(currentUnit.Name);

		
		/// STEP 1) 	 ---------------------   Capturing   ---------------------------
		/// have infantry chase and capture cities. enemy > vacant
		
		DECISION_MADE = AI.TRY_CAPTURE(__game, aiPlayer, currentUnit, spaces, destination);
		if(DECISION_MADE)
			moverClass.Add(destination[0], destination[1]);
		if(DECISION_MADE)console.log("capture", destination[0], destination[1]);
		AI.If_Capture_And_Should_Attack(__game, currentUnit, destination);


		/// STEP 2) 	 ---------------------   Attacking   ---------------------------
		/// first things first, try to attack for most possible damage

		if(!DECISION_MADE)
		{
			DECISION_MADE = AI.TRY_ATTACK(__game, aiPlayer, currentUnit, currentUnit.Current_Path().Attackables(), destination, moverClass);
			if(DECISION_MADE)console.log("atk", destination[0], destination[1]);
		}


		/// STEP 3) 	 ---------------------   Chase City   ---------------------------
		/// first things first, try to attack for most possible damage

		if(!DECISION_MADE)
		{
			DECISION_MADE = AI.CHASE_CITY(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)console.log("chase city", destination[0], destination[1]);
		}


		/// STEP 4) 	 ---------------------   Heal   ---------------------------
		/// If closed to dying
		/// attempt to heal
		
		if(!DECISION_MADE)
		if(currentUnit.Health/currentUnit.Max_Health<.5)
		{
			DECISION_MADE = AI.BEST_HEAL_CHOICE(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)console.log("healing", currentUnit.X, currentUnit.Y);
		}
		

		/// Step 5) 	 ---------------------   Chase Enemy   ---------------------------
		/// move units to into an attack formation

		if(!DECISION_MADE)
		{
			DECISION_MADE = AI.CHASE_ENEMY(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)console.log("chase enemy", destination[0], destination[1]);
		}
		

		/// STEP 6) 	 ---------------------   Heal   ---------------------------
		/// IF there is no found location
		/// respond by resting and healing
		
		if(!DECISION_MADE)
		{
			DECISION_MADE = AI.BEST_HEAL_CHOICE(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)console.log("healing", currentUnit.X, currentUnit.Y);
		}
		
		
		/// LAST STEP) 	 ---------------------   IDLE   ---------------------------
		/// IF healing isn't an option
		/// move out of way of important moves
		
		if(!DECISION_MADE)
		{
			DECISION_MADE = AI.IDLE_ROAM(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)console.log("idle roam", currentUnit.X, currentUnit.Y);
		}
		
		AI.Prep_Movement(__game, aiPlayer, currentUnit, destination, moverClass);
	},
	Be_Hostile:function(__game, aiPlayer, currentUnit)
	{	/** 4 STAR standing */
		var moverClass = new Move_Class(currentUnit,currentUnit.X,currentUnit.Y,__game.Terrain_Map,function(list){});
		currentUnit.Start_Path(currentUnit.X, currentUnit.Y, true);
		
		var destination = [-1, -1];
		var spaces = currentUnit.Current_Path().All_Movable_Spaces();
		var DECISION_MADE = false; // when true, stop looking for move, and go to finish


console.log(" ");
console.log("--");
console.log("****");
console.log(currentUnit.X, currentUnit.Y);
console.log(currentUnit.Name);

		
		/// STEP 1) 	 ---------------------   Attacking   ---------------------------
		/// first things first, try to attack for most possible damage
		
		DECISION_MADE = AI.TRY_ATTACK(__game, aiPlayer, currentUnit, currentUnit.Current_Path().Attackables(), destination, moverClass);
		if(DECISION_MADE)console.log("attack", destination[0], destination[1]);


		/// STEP 2) 	 ---------------------   Capturing   ---------------------------
		/// have infantry chase and capture cities. enemy > vacant

		if(!DECISION_MADE)
		{
			DECISION_MADE = AI.TRY_CAPTURE(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)console.log("capture", destination[0], destination[1]);
			AI.If_Capture_And_Should_Attack(__game, currentUnit, moverClass, destination);
		}


		/// Step 3) 	 ---------------------   Chasing   ---------------------------
		/// move units to into an attack formation

		if(!DECISION_MADE)
		{	// run thru all enemy units, and chase the one that will deal most damage
			DECISION_MADE = AI.CHASE_ENEMY(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)console.log("chasing", destination[0], destination[1]);
		}
		

		/// STEP 4) 	 ---------------------   Heal   ---------------------------
		/// IF there is no found location
		/// respond by resting and healing
		
		if(!DECISION_MADE)
		{
			DECISION_MADE = AI.BEST_HEAL_CHOICE(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)console.log("healing", currentUnit.X, currentUnit.Y);
		}
		

		/// LAST STEP) 	 ---------------------   IDLE   ---------------------------
		/// IF healing isn't an option
		/// move out of way of important moves
		
		if(!DECISION_MADE)
		{
			DECISION_MADE = AI.IDLE_ROAM(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)console.log("idle roam", currentUnit.X, currentUnit.Y);
		}
		
		AI.Prep_Movement(__game, aiPlayer, currentUnit, destination, moverClass);
	},
	Winning:function(__game, aiPlayer, currentUnit)
	{	/** 5 STAR standing */
		var moverClass = new Move_Class(currentUnit,currentUnit.X,currentUnit.Y,__game.Terrain_Map,function(list){});
		currentUnit.Start_Path(currentUnit.X, currentUnit.Y, true);
		
		var destination = [-1, -1];
		var spaces = currentUnit.Current_Path().All_Movable_Spaces();
		var DECISION_MADE = false; // when true, stop looking for move, and go to finish


console.log(" ");
console.log("--");
console.log("*****");
console.log(currentUnit.Name);

		
		/// STEP 1) 	 ---------------------   Attacking   ---------------------------
		/// first things first, try to attack for most possible damage
		
		DECISION_MADE = AI.TRY_ATTACK(__game, aiPlayer, currentUnit, currentUnit.Current_Path().Attackables(), destination, moverClass);
		if(DECISION_MADE)
			moverClass.Add(destination[0], destination[1]);
		if(DECISION_MADE)console.log("attacking", destination[0], destination[1]);


		/// Step 2) 	 ---------------------   Chasing   ---------------------------
		/// move units to into an attack formation

		if(!DECISION_MADE)
		{	// run thru all enemy units, and chase the one that will deal most damage
			DECISION_MADE = AI.CHASE_ENEMY(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)console.log("chase", destination[0], destination[1]);
		}
		

		/// STEP 3) 	 ---------------------   Heal   ---------------------------
		/// IF there is no found location
		/// respond by resting and healing
		
		if(!DECISION_MADE)
		{
			DECISION_MADE = AI.BEST_HEAL_CHOICE(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)console.log("healing", currentUnit.X, currentUnit.Y);
		}
		

		/// LAST STEP) 	 ---------------------   IDLE   ---------------------------
		/// IF healing isn't an option
		/// move out of way of important moves
		
		if(!DECISION_MADE)
		{
			DECISION_MADE = AI.IDLE_ROAM(__game, aiPlayer, currentUnit, spaces, destination);
			if(DECISION_MADE)
				moverClass.Add(destination[0], destination[1]);
			if(DECISION_MADE)console.log("idle roam", currentUnit.X, currentUnit.Y);
		}
		
		AI.Prep_Movement(__game, aiPlayer, currentUnit, destination, moverClass);
	},
	
		////////////////////////////
		/** Foundation functions  */
		////////////////////////////
	Act:function(__game, aiPlayer, currentUnit, destination, moverClass)
	{
		__game.Move(currentUnit, destination[0], destination[1], moverClass.Path(), function(__unit){
			if(__unit.Alpha.Get()!=0)
				INTERFACE.Scroll_To_Tile(currentUnit.X, currentUnit.Y);
			__unit.End_Turn();
			__game.Interface.Draw();
			setTimeout(function(){
				__game.Interface.Draw();
				AI.STATUS_CHOICE(AI.Check_Standings(aiPlayer), __game, aiPlayer);
			}, AI.TIMEOUT);
			__game.Interface.Draw();
		});
	},
	Prep_Movement:function(__game, aiPlayer, currentUnit, destination, moverClass)
	{
		__game.Interface.Draw();
		if(currentUnit.Alpha.Get()!=0)
		if(INTERFACE.isTileOnScreen(currentUnit.X, currentUnit.Y)!=0)
		{
			INTERFACE.Scroll_To_Tile(currentUnit.X, currentUnit.Y);
			
			setTimeout(function(){
				AI.Act(__game, aiPlayer, currentUnit, destination, moverClass);
			}, 200);
			return;
		}
		AI.Act(__game, aiPlayer, currentUnit, destination, moverClass);
	},
	AttackImpact:function(attackingUnit, defendingUnit)
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
	},
	ReturnFireImpact:function(attackingUnit, defendingUnit)
	{	// see how much % damage will be done in return
		var impact = 0; // percentage
		
		var defenderLeftoverHealth = defendingUnit.Health - attackingUnit.Calculate_Damage(defendingUnit);
		
		if(defenderLeftoverHealth<0)return impact;
		
		var defenderMaxHealth = Char_Data.CHARS[defendingUnit.Source].Max_Health;
		
		var defenderAfterAtk = defendingUnit.Clone(AI.FAKE_GAME);
		
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
	},
	Within_Range:function(target, x, y, range)
	{
			var dis = Math.abs(target.X-x)+Math.abs(target.Y-y);
			return dis<=range;
	},
	Refresh_Visible_Enemies:function(__player)
	{
		if(!AI.Fog_Check)return;
		AI.Visible_Enemies = __player.Game.Collect_Visible_Enemies(__player);
	},
	Sort_Units_By_Expense:function(unit_list)
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
	},
	If_Capture_And_Should_Attack:function(game, unit, dest)
	{
		var best_atk = 0.6, // do not want to attack if it will hurt itself over this percentage
			test_atk;
		var enemy_unit = game.Units_Map.At(dest[0]+1, dest[1]);
		if(enemy_unit!=null)
		if(enemy_unit.Player!=unit.Player)
		{
			test_atk = AI.ReturnFireImpact(unit, enemy_unit);
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
			test_atk = AI.ReturnFireImpact(unit, enemy_unit);
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
			test_atk = AI.ReturnFireImpact(unit, enemy_unit);
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
			test_atk = AI.ReturnFireImpact(unit, enemy_unit);
			if(test_atk<best_atk)
			{
				dest[1]--;
				best_atk = test_atk;
				return;
			}
		}
	},
	Check_Standings:function(aiPlayer)
	{
		return Math.round(aiPlayer.Check_Standing());
	},
	
		///////////////////////////////////////////////
		/** Main function that runs a whole AI turn  */
		///////////////////////////////////////////////
	Solve:function(__game, aiPlayer)
	{
		if(!aiPlayer.Active)return;
		AI.Recursion_Break = 50;
		AI.Last_Attempted = null;
		var aiState = AI.Check_Standings(aiPlayer);
		if(aiState==AI.STATE.Setup)
		{
			console.log(" ");
			console.log("+++++++");
			console.log(aiPlayer.Team,"Find Position");
			console.log(" ");
		}
		else if(aiState==AI.STATE.Argo)
		{
			console.log(" ");
			console.log("+++++++");
			console.log(aiPlayer.Team,"Argressive");
			console.log(" ");
		}
		else if(aiState==AI.STATE.Gathering)
		{
			console.log(" ");
			console.log("+++++++");
			console.log(aiPlayer.Team,"Gathering");
			console.log(" ");
		}
		else if(aiState==AI.STATE.Domination)
		{
			console.log(" ");
			console.log("+++++++");
			console.log(aiPlayer.Team,"Winning");
			console.log(" ");
		}
		else if(aiState==AI.STATE.Scared)
		{
			console.log(" ");
			console.log("+++++++");
			console.log(aiPlayer.Team,"Scared");
			console.log(" ");
		}
		AI.STATUS_CHOICE(aiState, __game, aiPlayer);
	},
};

