'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng] should look like this
    this.distance = distance; // km/hr
    this.duration = duration; // time
  }
  _setdescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcpace();
    this._setdescription();
  }
  calcpace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elev) {
    super(coords, distance, duration);
    this.elev = elev;
    this.calspeed();
    this._setdescription();
  }
  calspeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
// the app
class App {
  #mapEvent;
  #map;
  #workouts = [];
  constructor() {
    this._getGeolocation();
    form.addEventListener('submit', this._newWorkout.bind(this));
    // getting localstorafe data
    this.getLocalStorage();
    // changing the field of cycling or running condition
    inputType.addEventListener('change', this._toogleElevation);
    containerWorkouts.addEventListener(
      'click',
      this.goTOtheLocation.bind(this)
    );
  }

  _getGeolocation() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('Did not get the location.');
      }
    );
  }

  _loadMap(curLoc) {
    //getting location
    const { latitude, longitude } = curLoc.coords;
    const lanlat = [latitude, longitude];
    this.#map = L.map('map').setView(lanlat, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showform.bind(this));
    this.#workouts.forEach(work => {
      this.openmarker(work);
    });
  }

  _showform(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toogleElevation() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    // valid numbers or not

    const validnumber = (...numbers) => {
      return numbers.every(num => Number.isFinite(num));
    };
    function ispositive(...numbers) {
      return numbers.every(num => num > 0);
    }
    //getting the value
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //check the data if valid
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validnumber(distance, duration, cadence) ||
        !ispositive(distance, duration)
      )
        return alert('Number is not a finite number.');

      workout = new Running([lat, lng], distance, duration, cadence);
    }
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validnumber(distance, duration, elevation) ||
        !ispositive(distance, duration)
      )
        return alert('Number is not a finite number.');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //adding to workout
    this.#workouts.push(workout);
    this.renderworkout(workout);

    // adding marker
    this.openmarker(workout);
    // setlocal storage
    this.setLocalstorage();
    //clearung input fields
    this.clearingfrom();
  }

  openmarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 300,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.description}`)
      .openPopup();
  }

  renderworkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id= "${workout.id}" >
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
   
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    `;
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
        </li> 
      `;

    if (workout.type === 'running') {
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
      </li>
    `;
    }

    form.insertAdjacentHTML('afterend', html);
  }
  //clear form
  clearingfrom() {
    form.style.display = 'none';

    form.classList.add('hidden');
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  //moving the marker on location
  goTOtheLocation(e) {
    const clEl = e.target.closest('.workout');

    if (clEl === null) return;

    const workout = this.#workouts.find(work => work.id === clEl.dataset.id);

    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  //setting workout data on localstorage
  setLocalstorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  //getting workout data on localstorage
  getLocalStorage() {
    let data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(work => {
      this.renderworkout(work);
    });
  }
}

const app = new App();
