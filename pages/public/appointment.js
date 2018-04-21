/**
 * ./pages/public/appointment.js
 */

import { Component } from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
import { withStyles } from 'material-ui/styles';
import Grid from 'material-ui/Grid';
import TextField from 'material-ui/TextField';
import Button from 'material-ui/Button';

import withLayout from '../../lib/withLayout';
import { getDays } from '../../lib/days';

const styles = theme => ({
  root: {
    flexGrow: 1,
  },
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: '100%',
  },
  menu: {
    // width: 200,
  },
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing.unit * 2,
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
});

const services = ['School Physicals', 'Sports Physicals', 'Adult Physicals', 'DOT Physicals'];
const time = ['10 am', '11 am', '12 am', '1 pm', '2 pm', '3 pm', '4 pm', '5 pm'];

class Appointment extends Component {
  state = {
    currency: 'EUR',
  };

  handleChange = name => (event) => {
    this.setState({
      [name]: event.target.value,
    });
  };

  render() {
    const { classes } = this.props;

    return (
      <div style={{ padding: '10px 45px' }}>
        <Head>
          <title>Appointment</title>
          <meta name="description" content="Request an appointment." />
        </Head>

        <h1>Appointment</h1>

        <form
          className={classes.container}
          noValidate
          autoComplete="off"
          method="post"
          action="/appointment"
        >
          <Grid container spacing={40} alignContent="center">
            <Grid item xs={12} sm={6}>
              <TextField
                select
                name="service"
                label="Service"
                className={classes.textField}
                value={services[0]}
                // id="select-service-native"
                // value={this.state.currency}
                // onChange={this.handleChange('currency')}
                SelectProps={{
                  native: true,
                  MenuProps: {
                    className: classes.menu,
                  },
                }}
                helperText="Please select our service"
                margin="normal"
              >
                {services.map(service => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </TextField>

              <TextField
                name="day"
                id="select-day-native"
                select
                label="Day"
                className={classes.textField}
                value={this.state.currency}
                onChange={this.handleChange('currency')}
                SelectProps={{
                  native: true,
                  MenuProps: {
                    className: classes.menu,
                  },
                }}
                helperText="Please select appointment day"
                margin="normal"
              >
                {getDays().map(day => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </TextField>

              <TextField
                name="time"
                id="select-time-native"
                select
                label="Time"
                className={classes.textField}
                value={this.state.currency}
                onChange={this.handleChange('currency')}
                SelectProps={{
                  native: true,
                  MenuProps: {
                    className: classes.menu,
                  },
                }}
                helperText="Please select time slot"
                margin="normal"
              >
                {time.map(hour => (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                id="name"
                label="Name"
                InputLabelProps={{
                  shrink: true,
                }}
                placeholder="Enter name here"
                helperText="Please enter your name"
                fullWidth
                margin="normal"
                className={classes.textField}
              />

              <TextField
                name="phone"
                id="phone"
                type="number"
                label="Phone"
                InputLabelProps={{
                  shrink: true,
                }}
                placeholder="700-1234567"
                helperText="Please enter your phone number"
                fullWidth
                margin="normal"
                className={classes.textField}
              />

              <TextField
                name="email"
                id="email"
                label="E-mail"
                InputLabelProps={{
                  shrink: true,
                }}
                placeholder="name@example.com"
                helperText="Please enter your email"
                fullWidth
                margin="normal"
                className={classes.textField}
              />
              <Button variant="raised" type="submit" style={{ marginTop: 20 }}>
                Submit
              </Button>
            </Grid>
          </Grid>
        </form>
      </div>
    );
  }
}

Appointment.propTypes = {
  classes: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
};

// export default withStyles(styles)(withLayout(Appointment));
export default withLayout(withStyles(styles)(Appointment));
