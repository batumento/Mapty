'use strict';

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
  clicks = 0;
  constructor(coords, distance, duration) {
    //this.date = ...
    //this.id = ...
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  circleColor = 2;
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  circleColor = 1;
  constructor(coords, distance, duration, elev) {
    super(coords, distance, duration);
    this.elev = elev;
    this.calcSpeed();
    this._setDescription();
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
  #mapZoom = 14;
  #workouts = [];

  constructor() {
    //Get user's position
    this._getPosition();

    //Get data from local storage
    this._getLocalStorage();

    //Attach event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener(`change`, this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
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

    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoom);
    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
      this._renderWorkoutMarker(work);
      this._renderWorkoutCircle(work);
    });
    this.#map.on('click', this._showForm.bind(this));
  }
  _showForm(mapEventE) {
    this.#mapEvent = mapEventE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hiddenForm() {
    inputDistance.value =
      inputDuration.value =
      inputElevation.value =
      inputCadence.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validInput = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp) && +inp > 0);
    e?.preventDefault();

    //Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    //Which choose if selected(running, cycling)
    //Check for valid data
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (!validInput(distance, duration, cadence))
        return alert('Wrong input please check it');

      workout = new Running([lat, lng], distance, duration, cadence);
    }
    if (type === 'cycling') {
      const elev = +inputElevation.value;
      if (!validInput(distance, duration, elev))
        return alert('Wrong input please check it');

      workout = new Cycling([lat, lng], distance, duration, elev);
    }

    //Yeni objeyi workout array'e ekle
    this.#workouts.push(workout);
    //workout listesini ve isaretciyi güncelle
    //Marker
    this._renderWorkoutMarker(workout);
    this._renderWorkout(workout);
    //formu gizleyip input alanını temizle
    this._hiddenForm();
    this._renderWorkoutCircle(workout);

    //Set local storage to all workouts
    this._setLocalStorage();
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
      .setPopupContent(
        `${workout.type === 'running' ? '🏃' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
   <h2 class="workout__title">${workout.description}</h2>
   <div class="workout__details">
     <span class="workout__icon">${
       workout.type === 'running' ? '🏃' : '🚴‍♀️'
     }</span>
     <span class="workout__value">${workout.distance}</span>
     <span class="workout__unit">km</span>
   </div>
   <div class="workout__details">
     <span class="workout__icon">⏱</span>
     <span class="workout__value">${workout.duration}</span>
     <span class="workout__unit">min</span>
   </div>`;

    if (workout.type === 'running')
      html += `
    <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`;
    if (workout.type === 'cycling')
      html += `
    <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elev}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;

    form.insertAdjacentHTML('afterend', html);
  }
  _renderWorkoutCircle(workout) {
    L.circle(workout.coords, {
      //Page refresh issue
      color: `var(--color-brand--${workout.circleColor})`,
      fillColor: `var(--color-brand--${workout.circleColor})`,
      fillOpacity: 0.5,
      radius: 25,
    }).addTo(this.#map);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      workout => workout.id === workoutEl.dataset.id
    );
    this.#map.flyTo(workout.coords, this.#mapZoom + 2, {
      duration: 1,
    });

    workout.click();
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  //////

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    console.log(data);
    //In-depth copy is created with JSON.stringify
    let prototypedData = data.map(work => {
      const workout = Object.create(
        work.type === 'running' ? Running.prototype : Cycling.prototype
      );
      Object.assign(workout, work);
      return workout;
    });
    console.log(prototypedData);
    this.#workouts = prototypedData;
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}
const app = new App();

function exClick() {
  JSON.stringify();
}

//Recursive
/*_deepCopy(workout) {
    if (workout === null || typeof workout !== 'object') return workout;

    const copy = Array.isArray(workout) ? [] : {};

    for (var key in workout) {
      if (workout.hasOwnProperty(key)) {
        copy[key] = this._deepCopy(workout[key]);
      }
    }
    return copy;
  }*/
