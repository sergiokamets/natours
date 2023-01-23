const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const catchAsync = require('../utils/catchAsync');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourID);
  if (!tour) {
    return next(new AppError('No tour with such id', 404));
  }
  // create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourID
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    line_items: [
      {
        price_data: {
          unit_amount: tour.price * 100,
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/tour-1-cover.jpg`],
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
  });

  //send it back to the client
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // this is temporary, because it unsecure.
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
