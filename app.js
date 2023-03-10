const express = require('express');
const morgan = require('morgan');
const path = require('path');
//----Security packages------//
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
//-----//
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');
const app = express();

//implement CORS
// Set Access-Control-Allow-Origin *
app.use(cors());
// how to allow access for specific site (frontend), like api.natour.com, frontend example.com
// app.use(cors({
//   origin: 'https://www.example.com'
// }))

//add access for not simple requests(patch, delete, .etc) (either get or post)
app.options('*', cors());
//allow for specific routes
//app.options('/api/v1/tours/:id', cors())
app.enable('trust proxy');
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//1 Global Midlware
app.use(express.static(path.join(__dirname, 'public')));

//Set security http headers
// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         'worker-src': ['blob:'],
//         'child-src': ['blob:', 'https://js.stripe.com/'],
//         'img-src': ["'self'", 'data: image/webp'],
//         'script-src': [
//           "'self'",
//           'https://api.mapbox.com',
//           'https://cdnjs.cloudflare.com',
//           'https://js.stripe.com/v3/',
//           "'unsafe-inline'",
//         ],
//         'connect-src': [
//           "'self'",
//           'ws://localhost:*',
//           'ws://127.0.0.1:*',
//           'http://127.0.0.1:*',
//           'http://localhost:*',
//           'https://*.tiles.mapbox.com',
//           'https://api.mapbox.com',
//           'https://events.mapbox.com',
//         ],
//       },
//     },
//     crossOriginEmbedderPolicy: false,
//   })
// );

//development logs output
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from the same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

//body parser, reading data
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
//Data sanitization against NoSQL query injection
app.use(mongoSanitize());
//Data sanitization against malwares XSS
app.use(xss());

//prevent http parameters pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//compression
app.use(compression());

//test midleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//2. Route handlers
app.use('/', viewRouter);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  //   const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  //   err.status = 'fail';
  //   err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//Error handling midleware
app.use(globalErrorHandler);

module.exports = app;
