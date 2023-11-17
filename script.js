'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  //Color hiding for the circle
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration, type) {
    //this.date = ...
    //this.id = ...
    this.type = type;
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }
  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elev) {
    super(coords, distance, duration);
    this.elev = elev;
  }
  calcSpeed() {
    //km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
//Application Architecture
class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener(`change`, this._toggleElevationField);
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('Could not get your position');
      }
    );
  }
  _loadMap(position) {
    let { latitude } = position.coords;
    let { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 15);
    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
  }
  _showForm(mapEventE) {
    this.#mapEvent = mapEventE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    const validInput = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp) && +inp > 0);

    //Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    let circleColor = 1;
    //Which choose if selected(running, cycling)
    //Check for valid data
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (!validInput(distance, duration, cadence))
        return alert('Wrong input please check it');

      workout = new Running([lat, lng], distance, duration, cadence);
      circleColor = 2;
    }
    if (type === 'cycling') {
      const elev = +inputElevation.value;
      if (!validInput(distance, duration, elev))
        return alert('Wrong input please check it');

      workout = new Cycling([lat, lng], distance, duration, elev);
      circleColor = 1;
    }
    //Yeni objeyi workout array'e ekle
    this.#workouts.push(workout);
    console.log(workout);
    //workout listesini ve isaretciyi güncelle
    //Marker
    this._renderWorkoutMarker(workout);

    //formu gizleyip input alanını temizle
    inputDistance.value =
      inputDuration.value =
      inputElevation.value =
      inputCadence.value =
        '';
    this.renderWorkoutCircle(circleColor, workout);
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`Workout`)
      .openPopup();
  }
  renderWorkoutCircle(colorNmbr, workout) {
    L.circle(workout.coords, {
      //Page refresh issue
      color: `var(--color-brand--${colorNmbr})`,
      fillColor: `var(--color-brand--${colorNmbr})`,
      fillOpacity: 0.5,
      radius: 25,
    }).addTo(this.#map);
  }
}
const app = new App();
