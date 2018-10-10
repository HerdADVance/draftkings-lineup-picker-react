// DEPENDENCIES
import React, { Component } from 'react'

// COMPONENT
class Apps extends Component {

    constructor(props) {
        super(props);
        this.state = {
        }
    }

    componentDidMount() {
        //console.log(this.props)
    }

    render() {
        let apps = this.props.apps
        let numApps = apps.length

        return(
            apps.map((app, index) => (
                <option value={index + 1}>{index + 1} ({Math.round( ((index + 1) / numApps) * 100)}%)</option>
            ))
        )
    }
}

export default Apps;