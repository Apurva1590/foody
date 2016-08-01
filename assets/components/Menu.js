import React from 'react';
import moment from 'moment';
import authorization from 'authorization';
import DatePicker from 'material-ui/DatePicker';
import TableHeaderColumn from 'material-ui/Table/TableHeaderColumn';
import TableRow from 'material-ui/Table/TableRow';
import TableRowColumn from 'material-ui/Table/TableRowColumn';
import TableHeader from 'material-ui/Table/TableHeader';
import TableBody from 'material-ui/Table/TableBody';
import Table from 'material-ui/Table/Table';
import Paper from 'material-ui/Paper';
import AppBar from 'material-ui/AppBar';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import theme from '../style/theme';
import HomeIcon from 'material-ui/svg-icons/action/home';
import NoteAddIcon from 'material-ui/svg-icons/action/note-add';
import InputIcon from 'material-ui/svg-icons/action/input';
import MenuItem from 'material-ui/MenuItem';
import MenuAddorEditDialog from './MenuAddorEditDialog';

/* eslint-disable no-nested-ternary */

class Menu extends React.Component {
  static displayName = 'Menu'

  static propTypes = {
    params: React.PropTypes.object,
  }

  static contextTypes = {
    router: React.PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      meals: [],
      dishes: [],
      caterers: [],
      restrictions: [],
      dialogOpen: false,
      editItem: {},
    };
  }

  componentDidMount() {
    this.fetchItems();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.params.week !== this.props.params.week) {
      this.fetchItems();
    }
  }

  getDates() {
    const week = this.props.params.week === undefined ? moment().week() : this.props.params.week;
    return {
      week,
      today: moment().format('YYYY-MM-DD'),
      from: moment().week(week).day('Monday').format('YYYY-MM-DD'),
      to: moment().week(week).day('Friday').format('YYYY-MM-DD'),
    };
  }

  getFetchOptions(method, body) {
    const options = {
      headers: new Headers({
        'Content-Type': 'application/json',
        'Authorization': authorization,
      }),
      method,
      credentials: 'same-origin',
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    return options;
  }

  fetchItems() {
    const fetchOptions = this.getFetchOptions('GET');
    const dates = this.getDates();
    const url = `api/menu?from=${dates.from}&to=${dates.to}&withDishes=1`;

    fetch(url, fetchOptions)
      .then((response) => response.json())
      .then((jsonResponse) => {
        this.setState(jsonResponse);
      }).catch((err) => {
        throw new Error(err);
      });
  }


  changeWeek(date) {
    const week = moment(date).week();
    if (week !== this.props.params.week) {
      this.context.router.push(`/menu/${week}`);
    }
  }

  buildCatererLine(caterer) {
    return (<span>
      Caterer: <a href={caterer.website}>{caterer.title}</a>
      <br /><br />
    </span>);
  }

  buildDishesColumn(menu, meal, date, index) {
    const dishes = menu[date][meal.id];
    const dates = this.getDates();

    const rowStyle = {
      borderRight: index < 4 ? `solid 1px ${theme.tableRow.borderColor}` : 'none',
      verticalAlign: 'top',
      padding: '10px',
      backgroundColor: dates.today === date ? theme.palette.accent2Color : theme.palette.canvasColor,
    };

    if (dishes.length) {
      const catererMode = this.mode(dishes, 'caterer');
      const caterer = this.state.caterers.find(one => one.id === catererMode);

      return (
        <TableRowColumn key={date + index} style={ rowStyle }>
          {caterer ? this.buildCatererLine(caterer) : ''}
          {dishes.map((dish, i) => {
            return (
              <div
                key={'dish' + meal.id + i}
                style={ { whiteSpace: 'normal', marginBottom: '12px', cursor: authorization ? 'pointer' : 'default' }}
                className={authorization ? 'dishEditable' : ''}
                onClick={() => authorization ? this.setState({ editItem: dish, dialogOpen: true }) : null}
              >
                <div>
                  <span style={ { fontWeight: 'bold' } }>{dish.title}</span>
                  <span> {this.buildRestrictions(dish)}</span>
                </div>
                <div className="dishDescription">{dish.description}</div>
              </div>);})}
        </TableRowColumn>);
    }

    const emptyRowStyle = {
      fontStyle: 'italic',
      borderRight: index < 4 ? `solid 1px ${theme.tableRow.borderColor}` : 'none',
      verticalAlign: 'center',
      padding: '10px',
      textAlign: 'center',
      backgroundColor: dates.today === date ? theme.palette.accent2Color : theme.palette.canvasColor,
    };

    return (
      <TableRowColumn key={date + index} style={ emptyRowStyle }>
        <div>No {meal.title.toLowerCase()}</div>
      </TableRowColumn>);
  }

  buildRestrictions(dish) {
    if (!dish.restrictions) {
      return <span />;
    }

    const diets = dish.restrictions.split(',');

    return diets.map((diet, index) => {
      return (<span key={diet} style={ { fontStyle: 'italic' } }>
        {this.state.restrictions.find(r => r.id.toString() === diet).title.split(' ').map(word => word[0]).join('')}
        {index + 1 < diets.length ? ', ' : ''}
        </span>);});
  }

  buildSpecialMenu(mealDates, nonRequiredRows) {
    const dates = this.getDates();
    const home = <IconButton onClick={() => this.context.router.push('')}><div><HomeIcon color={theme.palette.canvasColor} hoverColor={theme.palette.primary1Color}/></div></IconButton>;

    const specialMenu = (<Paper zDepth={2} style={ { marginTop: '20px' } }>
      <AppBar
        className="menuAppBar"
        iconElementLeft={home}
        title={moment(dates.from).format('[Special Menu for] MMM D - ') + moment(dates.to).format('MMM D, Y')}
        style= { { backgroundColor: theme.palette.accent1Color } }
      />
      <Table selectable={false} style= { { borderCollapse: 'collapse' }}>
        <TableHeader key="header" displaySelectAll={false} adjustForCheckbox={false}>
          <TableRow>
            {mealDates.map((date, index) => {
              return (
              <TableHeaderColumn key={index} style={ {
                textAlign: 'center',
                borderRight: index < 4 ? `solid 1px ${theme.tableRow.borderColor}` : 'none',
                backgroundColor: dates.today === date ? theme.palette.accent2Color : theme.palette.canvasColor,
                color: theme.palette.textColor,
              } }
              >
                {moment(date).format('dddd')} ({moment(date).format('MMM D')})
              </TableHeaderColumn>);
            })}
          </TableRow>
        </TableHeader>
        <TableBody displayRowCheckbox={false}>
          {nonRequiredRows}
        </TableBody>
      </Table>
    </Paper>);

    return nonRequiredRows.length ? specialMenu : '';
  }

  buildLogo() {
    return { __html: window.logo };
  }

  buildMenu(mealDates, requiredRows) {
    const dates = this.getDates();
    const home = <IconButton onClick={() => this.context.router.push('')}><div><HomeIcon color={theme.palette.canvasColor} hoverColor={theme.palette.accent1Color}/></div></IconButton>;
    const add = (
      <IconMenu
        iconButtonElement={<IconButton><NoteAddIcon hoverColor={theme.palette.accent1Color} color={theme.palette.canvasColor}/></IconButton>}
        anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
        targetOrigin={{ horizontal: 'left', vertical: 'top' }}
      >
        <MenuItem primaryText="Add a dish" onClick={() => this.setState({ editItem: {}, dialogOpen: true })}/>
        <MenuItem primaryText="Manage dishes" onClick={() => this.context.router.push('/dishes')}/>
        <MenuItem primaryText="Manage caterers" onClick={() => this.context.router.push('/caterers')}/>
        <MenuItem primaryText="Manage meals" onClick={() => this.context.router.push('/meals')}/>
        <MenuItem primaryText="Manage restrictions" onClick={() => this.context.router.push('/restrictions')}/>
      </IconMenu>
    );
    const login = <IconButton onClick={() => window.location.href = this.context.router.createHref('', '') + 'login'}><div><InputIcon hoverColor={theme.palette.accent1Color} color={theme.palette.canvasColor}/></div></IconButton>;

    const title = (<div>
      <DatePicker
        mode="landscape"
        name="menu-date"
        autoOk
        value={moment().week().toString() === dates.week ? moment(dates.today).toDate() : moment(dates.from).toDate()}
        textFieldStyle={ { fontSize: '28px', height: 'auto', width: '50%' } }
        inputStyle={ { color: theme.palette.canvasColor, cursor: 'pointer' } }
        onChange={(e, date) => this.changeWeek(date) }
        formatDate={() => moment(dates.from).format('[Menu for] MMM D - ') + moment(dates.to).format('MMM D, Y')}
      />
    </div>);

    return (<div className="mainMenu">
    <Paper zDepth={2}>
      <AppBar
        className="menuAppBar"
        iconElementLeft={home}
        iconElementRight={authorization ? add : login}
        title={title}
      />
      <Table selectable={false} style= { { borderCollapse: 'collapse' }}>
        <TableHeader key="header" displaySelectAll={false} adjustForCheckbox={false}>
          <TableRow>
            {mealDates.map((date, index) => {
              return (
              <TableHeaderColumn key={index} style={ {
                textAlign: 'center',
                borderRight: index < 4 ? `solid 1px ${theme.tableRow.borderColor}` : 'none',
                backgroundColor: dates.today === date ? theme.palette.accent2Color : theme.palette.canvasColor,
                color: theme.palette.textColor,
              } }
              >
                {moment(date).format('dddd')} ({moment(date).format('MMM D')})
              </TableHeaderColumn>);
            })}
          </TableRow>
        </TableHeader>
        <TableBody displayRowCheckbox={false}>
          {requiredRows}
        </TableBody>
      </Table>
    </Paper>
    <div style={ { marginTop: '15px', fontStyle: 'italic' } }>
        {this.state.restrictions.map((diet, index) => {
          return (
          <span key={'dietString' + index}>
            {diet.title.split(' ').map(word => word[0]).join('')} is for {diet.title}
            {index !== this.state.restrictions.length - 1 ? index !== this.state.restrictions.length - 2 ? ', ' : ', and ' : ''}
          </span>);
        })}
      </div>
    </div>);
  }

  mode(_arr, field) {
    const arr = _arr.concat();
    const sorted = arr.sort((a, b) =>
      arr.filter(v => v[field] === a[field]).length - arr.filter(v => v[field] === b[field]).length
    ).pop();

    return sorted ? sorted[field] : null;
  }

  updateDishes(dishes, keepAdding = false, newItem) {
    this.setState({ dishes, dialogOpen: keepAdding, editItem: newItem || {} });
  }

  render() {
    const dates = this.getDates();
    const hasMeal = {};
    const menu = {};
    const mealDates = [];
    const requiredRows = [];
    const nonRequiredRows = [];
    const days = moment(dates.to).diff(dates.from, 'days');

    for (let i = 0; i <= days; i++) {
      const date = moment(dates.from).add(i, 'days').format('YYYY-MM-DD');
      mealDates.push(date);
    }

    mealDates.forEach((date) => this.state.meals.forEach((meal) => {
      menu[date] = menu[date] || {};
      menu[date][meal.id] = [];
    }));

    this.state.dishes.forEach((dish) => {
      menu[dish.served_on] = menu[dish.served_on] || { [dish.meal]: [] };
      if (menu[dish.served_on][dish.meal]) {
        menu[dish.served_on][dish.meal].push(dish);
      }
      hasMeal[dish.meal] = true;
    });

    this.state.meals.sort((a, b) => moment(b.starttime).hour() < moment(a.starttime).hour()).forEach((meal) => {
      if (hasMeal[meal.id] || meal.required) {
        const rows = meal.required ? requiredRows : nonRequiredRows;
        rows.push(<TableRow key={'meal-header' + meal.id}>
          <TableRowColumn
            style={ {
              backgroundColor: theme.palette.accent2Color,
              borderRight: `solid 1px ${theme.tableRow.borderColor}`,
              padding: '10px',
              textAlign: 'center' } }
            colSpan="5"
          >
            <span style={ { fontWeight: 'bold' } }>{meal.title}</span>
            <span> ({moment(meal.starttime).format('h:mm a')} - {moment(meal.endtime).format('h:mm a')})</span>
          </TableRowColumn>
        </TableRow>);

        rows.push(<TableRow key={'meal' + meal.id}>
          {mealDates.map((date, index) => this.buildDishesColumn(menu, meal, date, index))}
        </TableRow>);
      }
    });

    return (<div className="menu" style={ { width: '90%', margin: 'auto' } }>
        <MenuAddorEditDialog
          caterers={this.state.caterers}
          restrictions={this.state.restrictions}
          dishes={this.state.dishes}
          meals={this.state.meals}
          updateDishes={(...a) => this.updateDishes(...a)}
          open={this.state.dialogOpen}
          item={this.state.editItem}
        />
        <div style={ { marginTop: '5px', marginBottom: '10px' } }>
          <div dangerouslySetInnerHTML={this.buildLogo()} />
        </div>
        {this.buildMenu(mealDates, requiredRows)}
        {this.buildSpecialMenu(mealDates, nonRequiredRows)}
      </div>
    );
  }
}

module.exports = Menu;
