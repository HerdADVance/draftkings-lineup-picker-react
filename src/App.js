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
            selectedPlayers: [],
            selectedGames: [],
            selectedPosition: 'ALL',
            clickedPlayer: {
                dkId: null,
                apps: []
            },
            sliderValue: 0,
            sliderDelta: 0,
            correlations: [],
            random: true
        }
    }

    componentDidMount() {
        this.makeLineups(this.state.numLineups)
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
                players = this.state.selectedPlayers
                break
            default:
                players = players.filter(function(player){
                    return player.Position === position
                })
        }

        return players
    }

    handleGameClick(game){

        let games = this.state.games
        let players = PLAYERS
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
            players: players,
            selectedGames: selectedGames
        })

    }

    handlePlayerActionClick(player, delta){
        const clickedPlayer = this.state.clickedPlayer

        if(delta > 0) 
            this.addToLineups(player, delta, clickedPlayer)
        else if(delta < 0) 
            this.removeFromLineups(player, delta, clickedPlayer)
        else
            return
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

    isFlex(position){
        if(position === "QB" || position === "DST")
            return false
        else return true
    }

    removeFromLineups(player, delta, clickedPlayer){
        let lineups = this.state.lineups
        let removedFrom = []
        let pos = []
        let flex = true

        // Find out which slots to check based on position
        pos = this.positionsToCheck(player.Position)
        flex = this.isFlex(player.Position)

        // Checking each lineup where player appears
        for (var i=0; i < clickedPlayer.apps.length; i++){

            // Searching for lineup with matching id
            let obj = lineups.find((o, j) => {
                if (o.id === clickedPlayer.apps[i]) {
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

        // Maybe remove from Selected Players

        // Update clicked player stats
        for(var i=0; i < removedFrom.length; i++){
            var index = clickedPlayer.apps.indexOf(removedFrom[i])
            if(index > -1)
                clickedPlayer.apps.splice(index, 1)
        }
        
        // Set State
        this.setState({
            lineups: lineups,
            clickedPlayer: clickedPlayer,
            sliderDelta: 0,
            sliderValue: clickedPlayer.apps.length
        })
    }



    addToLineups(player, delta, clickedPlayer){
        
        let lineups = this.state.lineups
        let selectedPlayers = this.state.selectedPlayers
        let addedTo = []
        let pos = []
        let flex = true

        // Randomize lineup order if need be
        const random = this.state.random
        if(random) lineups = this.shuffle(lineups)

        // Find out which slots to check based on position
        pos = this.positionsToCheck(player.Position)
        flex = this.isFlex(player.Position)

        console.log(lineups)

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

        if(random) lineups = this.sortByKey(lineups, 'id')

        // Update clicked player stats
        for(var i=0; i < addedTo.length; i++){
            clickedPlayer.apps.push(addedTo[i])
        }

        // Add to Selected Players
        if(addedTo.length > 0){
            let found = false
            for(var i=0; i < selectedPlayers.length; i++){

                // Already in selected players so only update apps
                if(selectedPlayers[i].dkId === player.dkId){
                    selectedPlayers[i].apps = clickedPlayer.apps
                    var found = true
                    break
                }
            }

            if(!found){
                player.apps = clickedPlayer.apps
                selectedPlayers.push(player)
            } 

            console.log(selectedPlayers)
        }
        
        // Set State
        this.setState({
            lineups: lineups,
            selectedPlayers: selectedPlayers,
            clickedPlayer: clickedPlayer,
            sliderDelta: 0,
            sliderValue: clickedPlayer.apps.length
        })
    
    }


    handlePlayerClick(player){
        const dkId = player.dkId
        const lineups = this.state.lineups

        // Get lineup info for clicked player
        let apps = []
        for(var i=0; i < lineups.length; i++){
            for(var j=0; j < lineups[i].roster.length; j++){
                if(lineups[i].roster[j].player && lineups[i].roster[j].player.dkId === dkId){
                    apps.push(lineups[i].id)
                    break
                }
            }
        }

        // Build new clickedPlayer object with info
        let newClickedPlayer = {}
        newClickedPlayer.dkId = dkId
        newClickedPlayer.apps = apps

        // Set State
        this.setState({
            clickedPlayer: newClickedPlayer,
            sliderValue: apps.length,
            sliderDelta: 0

        })

    }

    handlePositionClick(position){

        let clickedPosition = position.name
        let selectedPosition = this.state.selectedPosition
        let positions = this.state.positions
        let players = PLAYERS
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
            players: players,
            positions: positions,
            selectedPosition: clickedPosition
        })
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
        let delta = value - this.state.clickedPlayer.apps.length
        this.setState({
            sliderDelta: delta
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
        let games = this.state.games
        let positions = this.state.positions
        let lineups = this.state.lineups
        let numLineups = this.state.numLineups

        let clickedPlayer = this.state.clickedPlayer

        let sliderValue = this.state.sliderValue
        let sliderDelta = this.state.sliderDelta

        let correlations = this.state.correlations

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
                            players?
                                players.map((player, index) => (

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
                                    player.dkId === clickedPlayer.dkId?
                                        <tr className="player-action">
                                            <td colSpan="6">
                                                <p>{player.Name} is currently in {clickedPlayer.apps.length} of {numLineups} lineups</p>
                                                
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
                                                    class="player-add-random" 
                                                    onChange={this.onRandomChange}
                                                >
                                                    <option value="random">Random</option>
                                                    <option value="ordered">Ordered</option>
                                                </select>

                                                <div className="player-correlations">
                                                    {
                                                    correlations.length > 0?
                                                        <h1>Correlations</h1>
                                                    :
                                                        <p>Add Correlations</p>
                                                    }
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

                        <table className="player-add-holder">
                            <tr className="player-add">
                                <td colSpan="6">
                                    <p className="player-add-currently-in"><span className="player-add-name"></span> is currently in <span className="player-add-number-lineups"></span> of <span className="player-add-total-lineups"></span> lineups.</p>
                                    <div className="player-add-slider"></div>
                                    <p><input className="player-add-slider-number" />(<span className="player-add-slider-pct"></span>%)</p>
                                    <p><button className="player-add-button" id="delta-plus">Add to <span className="player-add-delta"></span> more lineups.</button></p>
                                    <p><button className="player-add-button" id="delta-minus">Remove from <span className="player-add-delta"></span> lineups.</button></p>

                                    <div className="player-add-options">
                                        <button>Correlation</button>
                                        <button>Price</button>
                                        <button>Ordered</button>
                                        <button>Strictness</button>
                                    </div>            
                                    
                                    <input type="hidden" className="player-add-id" />

                                </td>
                            </tr>
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
