"use strict";
const moment = require('moment');

module.exports.setup = (router, db, auth) => {
  router.get('/api/dish', auth, (req, res) => {
    const offset = req.query.offset || 0;
    const items = req.query.items || 100;
    const sql = `select
        dish.id,
        dish.served_on,
        dish.title,
        dish.description,
	      dish.meal,
        dish.caterer,
        group_concat(dish_to_restriction.restriction_id) as restrictions
      from dish
        left join caterer on caterer.id = dish.caterer
        left join meal on meal.id = dish.meal
        left join dish_to_restriction on dish_to_restriction.dish_id = dish.id
      group by dish.id
      order by dish.served_on desc, meal desc
      limit $items offset $offset`;

    db.getAll(sql, { $items: items, $offset: offset }).then((dishes) => {
      res.json(dishes);
    }).catch((err) => {
      res.status(500).send(err);
    });
  });

  router.put('/api/dish', auth, (req, res) => {
    const title = req.body.title;
    const description = req.body.description || '';
    const caterer = req.body.caterer;
    const served_on = req.body.served_on;
    const meal = req.body.meal;
    const restrictions = req.body.restrictions || '';

    if (title && caterer && served_on && meal) {
      const params = {
        $title: title,
        $description: description,
        $caterer: caterer,
        $served_on: moment(served_on).format('YYYY-MM-DD'),
        $meal: meal
      };
      const sql1 = `insert
        into dish
        (title, description, caterer, served_on, meal)
        values
        ($title, $description, $caterer, $served_on, $meal)`;
      const sql2 = `insert into dish_to_restriction (dish_id, restriction_id) values ($id, $restriction)`;

      db.run(sql1, params)
        .then((stats) => {
          restrictions.split(',').map((restriction) => {
            if (restriction) {
              db.run(sql2, { $id: stats.lastID, $restriction: restriction });
            }
          });
          return stats;
        })
        .then((stats) => {
          res.json({ id: stats.lastID });
        }).catch((err) => {
          res.status(500).send(err);
        });
    } else {
      res.sendStatus(400);
    }
  });

  router.post('/api/dish/:id', auth, (req, res) => {
    const id = req.params.id;
    const title = req.body.title;
    const description = req.body.description || '';
    const caterer = req.body.caterer;
    const served_on = req.body.served_on;
    const meal = req.body.meal;
    const restrictions = req.body.restrictions || '';

    if (title && caterer && served_on && id && meal) {
      const params = {
        $title: title,
        $description: description,
        $caterer: caterer,
        $served_on: moment(served_on).format('YYYY-MM-DD'),
        $meal: meal,
        $id: id,
      };

      const sql1 = `update dish set title=$title, description=$description, caterer=$caterer, served_on=$served_on, meal=$meal where id=$id`;
      const sql2 = `delete from dish_to_restriction where dish_id = $id;`;
      const sql3 = `insert into dish_to_restriction (dish_id, restriction_id) values ($id, $restriction)`;

      db.run(sql1, params)
        .then(() => {
          db.run(sql2, { $id: id });
        })
        .then(() => {
          restrictions.split(',').map((restriction) => {
            if (restriction) {
              db.run(sql3, { $id: id, $restriction: restriction });
            }
          });
        })
        .then(() => res.json({ id }))
        .catch((err) => {
          res.status(500).send(err);
        });
    } else {
      res.status(400).send('missing some fields');
    }
  });

  router.delete('/api/dish', auth, (req, res) => {
    const ids = req.body.ids;
    const sql1 = 'delete from dish_to_restriction where dish_id in (' + ids.map(() => '?').join(',') + ')';
    const sql2 = 'delete from dish where id in (' + ids.map(() => '?').join(',') + ')';
    const params = ids;

    db.run(sql1, params)
      .then(() => db.run(sql2, params))
      .then(() => {
        res.json(ids);
      }).catch((err) => {
        res.status(500).send(err);
      });
  });

  router.delete('/api/dish/:id', auth, (req, res) => {
    const id = req.params.id;
    const sql1 = 'delete from dish_to_restriction where dish_id=$id';
    const sql2 = 'delete from dish where id=$id';
    const params = { $id: id };

    db.run(sql1, params)
      .then(() => db.run(sql2, params))
      .then(() => {
        res.json({ id });
      }).catch((err) => {
        res.status(500).send(err);
      });
  });
};
