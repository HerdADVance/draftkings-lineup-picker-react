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
                apps: 0
            },
            sliderValue: 0,
            sliderDelta: 0
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
            this.addToLineups(player, delta)
        else if(delta < 0) 
            this.removeFromLineups()
        else
            return

    }

    addToLineups(player, delta){
        
        const lineups = this.state.lineups
        let added = 0
        let pos = []
        let flex = true

        // Find out which slots to check based on position
        switch(player.Position){
            case 'QB':
                pos = [0]
                flex = false
                break
            case 'RB':
                pos = [1,2,7]
                break
            case 'WR':
                pos = [3,4,5,7]
                break
            case 'TE':
                pos = [6,7]
                break
            case 'DST':
                pos = [8]
                flex = false
                break
            default:
                return "ERROR"
        }

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
                    //if(!dupe){
                        lineups[i].roster[key].player = player
                        lineups[i].salary -= player.Salary
                        added ++
                        break
                   // }
                }
            }

            // Prevent same player in lineup
            // Salary remaining for lineup
            // Set 

            // We've hit the amount to add so breakout of top lineups loop
            if(added === delta) break

        }

    console.log(lineups)

    // Set State
    this.setState({lineups: lineups})
    
    }


    handlePlayerClick(player){
        const salary = player.salary
        const position = player.position
        const team = player.teamAbbrev
        const oldClickedPlayer = this.state.clickedPlayer
        const dkId = player.dkId
        const lineups = this.state.lineups

        // Get lineup info for clicked player
        let apps = 0
        for(var i=0; i < lineups.length; i++){
            for(var j=0; j < lineups[i].roster.length; j++){
                if(lineups[i].roster[j].player && lineups[i].roster[j].player.dkId === dkId){
                    apps ++
                    break
                }
            }
        }

        // Build new clickedPlayer object with info
        let newClickedPlayer = {}
        newClickedPlayer.dkId = dkId
        newClickedPlayer.apps = apps

        console.log(newClickedPlayer)



        // Set State
        this.setState({
            clickedPlayer: newClickedPlayer,
            sliderValue: apps,
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

    onSliderChange = (value) => {
        this.setState({
            sliderValue: value
        })
    }

    onAfterSliderChange = (value) => {
        let delta = value - this.state.clickedPlayer.apps
        this.setState({
            sliderDelta: delta
        })
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
                                                <p>{player.Name} is currently in {clickedPlayer.apps} of {numLineups} lineups</p>
                                                
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
                                    <tr className="total">
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
