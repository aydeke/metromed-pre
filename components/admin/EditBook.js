/**
 * ./components/admin/EditBooks.js
 * The component EditBook makes up most of the interface
 * for our add-book.js and edit-book.js pages.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Button from 'material-ui/Button';
import TextField from 'material-ui/TextField';
import Input from 'material-ui/Input';
import Select from 'material-ui/Select';
import { MenuItem } from 'material-ui/Menu';

import { getGithubRepos } from '../../lib/api/admin';
import { styleTextField } from '../../components/SharedStyles';
import notify from '../../lib/notifier';
// import logger from '../../server/logs';

class EditBook extends React.Component {
  static propTypes = {
    book: PropTypes.shape({
      _id: PropTypes.string.isRequired,
    }),
    onSave: PropTypes.func.isRequired,
  };

  static defaultProps = {
    book: null,
  };

  constructor(props) {
    super(props);

    // constructor sets an initial state
    // with book and repos:
    this.state = {
      book: props.book || {},
      repos: [],
    };
  }

  async componentDidMount() {
    // As always, we call the method only after our component mounts,
    // using our favorite async/await and try/catch combo:
    try {
      // One important purpose of this component is
      // to call getGithubRepos() to get a list of repos.
      // Our Admin user will select one Github repo
      // out of this list to create a book:
      const { repos } = await getGithubRepos();
      this.setState({ repos }); // eslint-disable-line
    } catch (err) {
      // logger.error(err);
      console.log(err); // eslint-disable-line
    }
  }

  /**
   * The component EditBook is essentially a simple form with a Save button.
   * The form has three items:
   * - book name (<TextField>),
   * - book title (also <TextField>),
   * - and a dropdown list of repos (<Select> with <MenuItem>).
   * When our Admin clicks Save, the form gets submitted,
   * thereby triggering onSubmit = (event) =>.
   */
  onSubmit = (event) => {
    event.preventDefault();
    // The event passes name, price, and githubRepo
    // to this.state.book with ES6 destructuring:
    const { name, price, githubRepo } = this.state.book;

    if (!name) {
      notify('Name is required');
      return;
    }

    if (!price) {
      notify('Price is required');
      return;
    }

    if (!githubRepo) {
      notify('Github repo is required');
      return;
    }

    // If all three parameters exist,
    // then they are passed to the onSave function as this.state.book,
    // and we call the onSave prop function
    // (i.e. parameter of props object, this.props.onSave):
    this.props.onSave(this.state.book);
  };

  render() {
    return (
      <div style={{ padding: '10px 45px' }}>
        <form onSubmit={this.onSubmit}>
          <br />
          <div>
            <TextField
              onChange={(event) => {
                this.setState({
                  book: Object.assign({}, this.state.book, { name: event.target.value }),
                });
              }}
              value={this.state.book.name}
              type="text"
              label="Book's title"
              className="textFieldLabel"
              style={styleTextField}
              required
            />
          </div>
          <br />
          <br />
          <TextField
            onChange={(event) => {
              this.setState({
                book: Object.assign({}, this.state.book, { price: Number(event.target.value) }),
              });
            }}
            value={this.state.book.price}
            type="number"
            label="Book's price"
            className="textFieldInput"
            style={styleTextField}
            step="1"
            required
          />
          <br />
          <br />
          <div>
            <span>Github repo: </span>
            <Select
              value={this.state.book.githubRepo || ''}
              input={<Input />}
              onChange={(event) => {
                this.setState({
                  book: Object.assign({}, this.state.book, { githubRepo: event.target.value }),
                });
              }}
            >
              <MenuItem value="">
                <em>-- choose github repo --</em>
              </MenuItem>
              {this.state.repos.map(r => (
                <MenuItem value={r.full_name} key={r.id}>
                  {r.full_name}
                </MenuItem>
              ))}
            </Select>
          </div>
          <br />
          <br />
          <Button variant="raised" type="submit">
            Save
          </Button>
        </form>
      </div>
    );
  }
}

export default EditBook;
