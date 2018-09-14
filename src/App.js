import React, { Component } from 'react'
import './App.css';

import PLAYERS from './data/players'
import GAMES from './data/games'
import POSITIONS from './data/positions'

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            players: PLAYERS,
            games: GAMES,
            positions: POSITIONS,
            lineups: [],
            lineupsAmount: 50,
            selectedPlayers: [],
            selectedGames: [],
            selectedPosition: 'ALL'
        }
    }

    componentDidMount() {
        this.makeLineups(this.state.lineupsAmount)
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

        console.log(selectedGames)

        // Set State
        this.setState({
            games: games, 
            players: players,
            selectedGames: selectedGames
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
            lineup.id = i
            lineup.roster = {
                QB: null,
                RB1: null,
                RB2: null,
                WR1: null,
                WR2: null,
                WR3: null,
                TE: null,
                FLEX: null,
                DST: null
            }
            lineups.push(lineup)
        }

        this.setState({lineups: lineups})
        
    }

    render() {

        let players = this.state.players
        let games = this.state.games
        let positions = this.state.positions
        let lineups = this.state.lineups

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
                                    <tr className="player">
                                        <td className="position">{player.Position}</td>
                                        <td className="name">{player.Name}</td>
                                        <td className="team">{player.teamAbbrev}</td>
                                        <td className="salary">${player.Salary}</td>
                                        <td className="ppg">{player.AvgPointsPerGame}</td>
                                        <td className="gameinfo">{player.GameInfo}</td>
                                    </tr>
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
                                        <th colSpan="4">Lineup # {index}</th>
                                    </tr>
                                    <tr>
                                        <td>QB</td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td>RB1</td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td>RB2</td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td>WR1</td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td>WR2</td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td>WR3</td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td>TE</td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td>FLEX</td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td>DST</td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                    <tr className="total">
                                        <td colSpan="2">Remaining: </td>
                                        <td colSpan="2"></td>
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
