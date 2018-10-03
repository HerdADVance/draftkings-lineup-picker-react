// DEPENDENCIES
import React, { Component } from 'react'
import { Fragment } from 'react'
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';

// CSS
import 'rc-slider/assets/index.css';
import './App.css';

// DATA
import PLAYERS from './data/players'
import GAMES from './data/games'
import POSITIONS from './data/positions'

// SLIDER & TOOLTIP SETUP
// const createSliderWithTooltip = Slider.createSliderWithTooltip;
// const Range = createSliderWithTooltip(Slider.Range);
// const Handle = Slider.Handle;
// const handle = (props) => {
//   const { value, dragging, index, ...restProps } = props;
//   return (
//     <Tooltip
//       prefixCls="rc-slider-tooltip"
//       overlay={value}
//       visible={dragging}
//       placement="top"
//       key={index}
//     >
//       <Handle value={value} {...restProps} />
//     </Tooltip>
//   );
// };




// APP
class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            players: PLAYERS,
            games: GAMES,
            positions: POSITIONS,
            lineups: [],
            numLineups: 50,
            filteredPlayers: PLAYERS,
            selectedGames: [],
            selectedPosition: 'ALL',
            clickedPlayer: null,
            clickedPlayerApps: 0,
            sliderValue: 0,
            sliderDelta: 0,
            correlations: [],
            random: true
        }
    }

    componentDidMount() {
        this.makeLineups(this.state.numLineups)
    }

    addToLineups(player, delta){
        
        let lineups = this.state.lineups
        let players = this.state.players
        let addedTo = []
        let pos = []
        let flex = true
        const prevApps = player.apps.length
        let newApps = player.apps.length
        let playerIndex = false

        // Find player objectindex in players array 
        let obj = players.find((o, i) => {
            if (o.dkId === player.dkId){
                playerIndex = i
                return true
            }
        });

        // Randomize lineup order if need be
        const random = this.state.random
        if(random) lineups = this.shuffle(lineups)

        // Find out which slots to check based on position
        pos = this.positionsToCheck(player.Position)
        flex = this.isFlex(player.Position)

        
        // Checking each lineup
        for(var i=0; i < lineups.length; i++){

            // Checking each spot in lineup
            Loop1:
            for(var j=0; j < pos.length; j++){
                
                var key = pos[j]
                
                // Spot is empty so eligible to add player
                if(!lineups[i].roster[key].player){
                    
                    // Prevent duplicate player in lineup, only need to check if flex
                    if(flex){
                        for(var k = 0; k < pos.length; k++){
                            var innerKey = pos[k]
                            if(lineups[i].roster[innerKey].player){
                                if(lineups[i].roster[innerKey].player.dkId === player.dkId){
                                    break Loop1
                                }
                            }
                        }
                    }

                    // Add player to lineup, deduct salary, add to counter
                    lineups[i].roster[key].player = player
                    lineups[i].salary -= player.Salary
                    addedTo.push(lineups[i].id)
                    break
                }
            }

            // We've hit the amount to add so breakout of top lineups loop
            if(addedTo.length === delta) break

        }

        // Re-sort lineups by Id
        if(random) lineups = this.sortByKey(lineups, 'id')

        // Only need these steps if player was added to any lineups
        if(addedTo.length > 0){

            // Add to Selected Players if not already
            if(!players[playerIndex].selected) players[playerIndex].selected = true

            // Add to player appearances
            let apps = players[playerIndex].apps
            for(var i=0; i < addedTo.length; i++){
                apps.push(addedTo[i])
            }
            players[playerIndex].apps = apps

            // Update number of apps for slider and clickedPlayerApps
            newApps = prevApps + addedTo.length

        }
 
        // Set State
        this.setState({
            lineups: lineups,
            players: players,
            sliderDelta: 0,
            sliderValue: newApps,
            clickedPlayerApps: newApps
        })
    
    }

    filterPlayersByGame(players, games){

        let teams = []
        for(var i=0; i < games.length; i++){
            teams.push(games[i].home)
            teams.push(games[i].road)
        }

        players = players.filter( function( player ) {
          return teams.includes( player.teamAbbrev );
        } );

        return players

    }

    filterPlayersByPosition(players, position){
        switch(position){
            case 'FLEX':
                players = players.filter(function(player){
                    return player.Position !== 'QB' &&  player.Position !== 'DST'
                }); 
                break
            case 'ALL': 
                break
            case 'SEL':
                players = players.filter(function(player){
                    return player.selected
                }); 
                break
            default:
                players = players.filter(function(player){
                    return player.Position === position
                })
        }

        return players
    }

    handleGameClick(game){

        console.log(this.state.filteredPlayers)

        let games = this.state.games
        let players = this.state.players
        let selectedGames = this.state.selectedGames
        const selectedPosition = this.state.selectedPosition

        let gid = game.id
        let wasSelected = game.selected

        // Toggle blue highlight for selected game
        let obj = games.find((o, i) => {
            if (o.id === gid) {
                games[i].selected = !games[i].selected
                return true
            }
        });

        // Toggling from true to false so removing players from selected game
        if(wasSelected){
            if(selectedGames.length === 1){ // Only game selected so show all
                players = this.filterPlayersByPosition(players, selectedPosition)
                selectedGames = []
            } else{
                // Find game to be removed from selectedGames then filter
                selectedGames = selectedGames.filter(function(selectedGame){
                    return selectedGame.id !== gid
                })
                players = this.filterPlayersByPosition(players, selectedPosition)
                players = this.filterPlayersByGame(players, selectedGames)
            }
        } else{ // Toggling from false to true so adding players from selected game
            selectedGames.push(game)
            players = this.filterPlayersByPosition(players, selectedPosition)
            players = this.filterPlayersByGame(players, selectedGames)
        }      

        // Set State
        this.setState({
            games: games, 
            filteredPlayers: players,
            selectedGames: selectedGames
        })

    }

    handlePlayerActionClick(player, delta){
        const clickedPlayer = this.state.clickedPlayer

        if(delta > 0) 
            this.addToLineups(player, delta)
        else if(delta < 0) 
            this.removeFromLineups(player, delta)
        else
            return
    }

    handleAddCorrelation(player){
        let correlations = player.correlations
        let correlation = this.makeCorrelation(player)
        this.setState({ correlations: [correlation] })
    }


    handlePlayerClick(player){
        const dkId = player.dkId

        // Set State
        this.setState({
            clickedPlayer: player.dkId,
            clickedPlayerApps: player.apps.length,
            sliderValue: player.apps.length,
            sliderDelta: 0,
            correlations: player.correlations
        })

    }

    handlePositionClick(position){

        let clickedPosition = position.name
        let selectedPosition = this.state.selectedPosition
        let positions = this.state.positions
        let players = this.state.players
        const selectedGames = this.state.selectedGames

        // Do nothing because that position is already clicked
        if(selectedPosition === clickedPosition) return


        // Highlight green tab of selected
        for(var i=0; i < positions.length; i++){
            if(positions[i].name  === clickedPosition) positions[i].selected = true
                else positions[i].selected = false
        }

        // We only need to sort existing players because none need to be added on this click
        // if(selectedPosition == 'ALL') 

        // Filter players by position
        players = this.filterPlayersByPosition(players, clickedPosition)

        // If no selected games our job is done here, otherwise sort by position
        if(selectedGames.length > 0){
            players = this.filterPlayersByGame(players, selectedGames)
        }

        // Set State
        this.setState({
            filteredPlayers: players,
            positions: positions,
            selectedPosition: clickedPosition
        })
    }

    isFlex(position){
        if(position === "QB" || position === "DST")
            return false
        else return true
    }

    makeCorrelation(player){
        let correlation = {
            dkId: null,
            positive: null,
            limit: null
        }
        return correlation
    }

    makeLineups(num){
        let lineups = []

        for(let i = 0; i < num; i++){
            let lineup = {}
            lineup.id = i + 1
            lineup.salary = 50000
            lineup.roster = [
                {
                    position: 'QB',
                    player: null
                },
                {
                    position: 'RB',
                    player: null
                },
                {
                    position: 'RB',
                    player: null
                },
                {
                    position: 'WR',
                    player: null
                },
                {
                    position: 'WR',
                    player: null
                },
                {
                    position: 'WR',
                    player: null
                },
                {
                    position: 'TE',
                    player: null
                },
                {
                    position: 'FLEX',
                    player: null
                },
                {
                    position: 'DST',
                    player: null
                }
            ]
            lineups.push(lineup)
        }

        this.setState({lineups: lineups})
        
    }

    onRandomChange = (e) => {
        let random = true
        if(e.target.value !== "random")
            random = false

        this.setState({ random: random })
    }

    onSliderChange = (value) => {
        this.setState({
            sliderValue: value
        })
    }

    onAfterSliderChange = (value) => {
        let delta = value - this.state.clickedPlayerApps
        this.setState({
            sliderDelta: delta
        })
    }

    positionsToCheck(position){
        let positions = []
        switch(position){
            case 'QB':
                positions = [0]
                break
            case 'RB':
                positions = [1,2,7]
                break
            case 'WR':
                positions = [3,4,5,7]
                break
            case 'TE':
                positions = [6,7]
                break
            case 'DST':
                positions = [8]
                break
            default:
                return "ERROR"
        }

        return positions
    }

    removeFromLineups(player, delta){
        let lineups = this.state.lineups
        let players = this.state.players
        let selectedPlayers = this.state.selectedPlayers
        let removedFrom = []
        let pos = []
        let flex = true
        const prevApps = player.apps.length
        let newApps = player.apps.length
        let playerIndex = false

        // Find player objectindex in players array 
        let obj = players.find((o, i) => {
            if (o.dkId === player.dkId){
                playerIndex = i
                return true
            }
        });

        let playerApps = players[playerIndex].apps

        // Find out which slots to check based on position
        pos = this.positionsToCheck(player.Position)
        flex = this.isFlex(player.Position)

        // Randomize lineup order if need be
        const random = this.state.random
        if(random) playerApps = this.shuffle(playerApps)


        // Checking each lineup where player appears
        for (var i=0; i < playerApps.length; i++){

            // Searching for lineup with matching id
            let obj = lineups.find((o, j) => {
                if (o.id === playerApps[i]) {
                    for(var k=0; k < pos.length; k++){
                        let key = pos[k]

                        // Found the player
                        if(lineups[j].roster[key].player && lineups[j].roster[key].player.dkId === player.dkId){

                            // Remove player from lineup, add salary, add to counter
                            lineups[j].roster[key].player = null
                            lineups[j].salary += player.Salary
                            removedFrom.push(lineups[j].id)
                            return true
                        }
                    }
                    
                }
            })

            // We've hit the number to remove so stop
            if(removedFrom.length === Math.abs(delta)) break

         }

        // Only need these steps if player was removed from any lineups
        if(removedFrom.length > 0){

            // Actually remove apps and update in players array
            for(var j=0; j < removedFrom.length; j++){
                var index = playerApps.indexOf(removedFrom[j])
                if(index > -1)
                    playerApps.splice(index, 1)
            }
            players[playerIndex].apps = playerApps


            // Remove from Selected Players if reduced to zero
            if(prevApps === removedFrom.length){
                players[playerIndex].selected = false
            }

            // Update number of apps for slider and clickedPlayerApps
            newApps = prevApps - removedFrom.length

        }

        // Set State
        this.setState({
            lineups: lineups,
            players: players,
            sliderDelta: 0,
            sliderValue: newApps,
            clickedPlayerApps: newApps
        })
    }


    shuffle(array) {
      var currentIndex = array.length, temporaryValue, randomIndex
      while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex)
        currentIndex -= 1
        temporaryValue = array[currentIndex]
        array[currentIndex] = array[randomIndex]
        array[randomIndex] = temporaryValue
      }

      return array
    }

    sortByKey(array, key) {
        return array.sort(function(a, b) {
            var x = a[key]; var y = b[key];
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
    }

    render() {

        let players = this.state.players
        let filteredPlayers = this.state.filteredPlayers
        let games = this.state.games
        let positions = this.state.positions
        let lineups = this.state.lineups
        let numLineups = this.state.numLineups

        let clickedPlayer = this.state.clickedPlayer

        let sliderValue = this.state.sliderValue
        let sliderDelta = this.state.sliderDelta

        let correlations = this.state.correlations
        let correlationsLength = correlations.length

        return (
            <div className="wrapper">
                <div className="list">
                    <div className="positions">
                        <ul className="clickable">
                            {
                            positions?
                                positions.map((position) => (
                                    <li 
                                        key={position.name}
                                        className={position.selected ? 'selected' : ''}
                                        onClick={() => {this.handlePositionClick(position) }} 
                                    >
                                    {position.name}
                                    </li>
                                ))
                            :
                                ''
                            }
                        </ul>
                    </div>
                    <div className="games">
                        <ul className="clickable">

                            {
                            games?
                                games.map((game) => (
                                    <li 
                                        key={game.id}
                                        className={game.selected ? 'selected' : ''}
                                        onClick={() => {this.handleGameClick(game) }} 
                                    >
                                    {game.road} @ {game.home}
                                    </li>
                                ))
                            :
                                <p>Loading games</p>
                            }

                        </ul>
                    </div>

                    <div className="players-wrap">
                        
                        <table className="players clickable">
                            {
                            filteredPlayers?
                                filteredPlayers.map((player, index) => (

                                    <Fragment>
                                   
                                    <tr className="player" onClick={() => {this.handlePlayerClick(player) }} >
                                        <td className="position">{player.Position}</td>
                                        <td className="name">{player.Name}</td>
                                        <td className="team">{player.teamAbbrev}</td>
                                        <td className="salary">${player.Salary}</td>
                                        <td className="ppg">{player.AvgPointsPerGame}</td>
                                        <td className="gameinfo">{player.GameInfo}</td>
                                     
                                    </tr>

                                    {
                                    player.dkId === clickedPlayer?
                                        <tr className="player-action">
                                            <td colSpan="6">
                                                <p>{player.Name} is currently in {player.apps.length} of {numLineups} lineups</p>
                                                
                                                <Slider 
                                                    value={sliderValue}
                                                    min={0}
                                                    max={numLineups}
                                                    onChange={this.onSliderChange} 
                                                    onAfterChange={this.onAfterSliderChange}
                                                />
                                                <button
                                                    className={"player-add-button " + (sliderDelta >= 0 ? 'positive' : 'negative') }
                                                    onClick={() => {this.handlePlayerActionClick(player, sliderDelta) }}
                                                >
                                                    {
                                                    sliderDelta >= 0 ?
                                                        'Add to '
                                                    :
                                                        'Remove from '  
                                                    }
                                                    {Math.abs(sliderDelta)} Lineups
                                                </button>

                                                <select 
                                                    className="player-add-random" 
                                                    onChange={this.onRandomChange}
                                                >
                                                    <option value="random">Random</option>
                                                    <option value="ordered">Ordered</option>
                                                </select>

                                                <div className="player-correlations">
                                                    {
                                                    correlationsLength > 0?
                                                        correlations.map((c, cindex) => (
                                                            <div className="correlation-row">
                                                                <div className="correlation-player">
                                                                    <select>
                                                                        {
                                                                        players?
                                                                            players.map((p, pindex) => (
                                                                                <option value={p.dkId}>{p.Name}</option>
                                                                            ))
                                                                        :
                                                                            ''
                                                                        }
                                                                    </select>
                                                                </div>
                                                                <div>B</div>
                                                                <div>C</div>
                                                                <div>D</div>
                                                            </div>
                                                        ))
                                                    :
                                                        ''
                                                    }

                                                    <button 
                                                        className="add-correlations"
                                                        onClick={() => this.handleAddCorrelation(player)}
                                                    >
                                                        Add Correlation
                                                    </button>

                                                </div>

                                            </td>
                                        </tr>
                                    :
                                        ''
                                    }

                                    

                                    </Fragment>
                                ))
                            :
                                <p>Loading players</p>
                            }
                        </table>

                    </div>

                </div>
                <div className="lineups">
                    <div className="lineups-wrap">
                        {
                        lineups?
                            lineups.map((lineup, index) => (
                                <table className="lineup">
                                    <tr>
                                        <th colSpan="4">Lineup # {lineup.id}</th>
                                    </tr>
                                    {
                                    lineup.roster.map((slot, index) => (
                                        <tr>
                                            <td>{slot.position}</td>
                                            <td>{slot.player ? slot.player.Name : ''}</td>
                                            <td>{slot.player ? slot.player.Salary : ''}</td>
                                            <td>{slot.player ? '-' : '+'}</td>
                                        </tr>
                                    ))
                                    }
                                    <tr className={"total " + (lineup.salary >= 0 ? 'positive' : 'negative') }>
                                        <td colSpan="2">Remaining: {lineup.salary}</td>
                                        <td colSpan="2">{50000 - lineup.salary}</td>
                                    </tr>
                                </table>
                            ))
                        :
                            <p>Loading lineups</p>
                        }
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
