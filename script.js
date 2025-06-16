document.addEventListener('DOMContentLoaded', function() {
    AOS.init();

    const calculateButton = document.getElementById('calculate');
    const resultsSection = document.querySelector('.results-section');
    const mainAgeDiv = document.getElementById('main-age');
    const timelineBreakdownDiv = document.getElementById('timeline-breakdown');
    const birthdayCountdownDiv = document.getElementById('birthday-countdown');
    const zodiacInfoDiv = document.getElementById('zodiac-info');
    const dayBornDiv = document.getElementById('day-born');
    const historicalFactsDiv = document.getElementById('historical-facts');
    const dobInput = document.getElementById('dob');

    calculateButton.addEventListener('click', async function(event) {
        event.stopPropagation(); // Prevent the click event from propagating
        console.log('Calculate button clicked!');
        const dobValue = dobInput.value;

        if (!dobValue) {
            alert('Please enter a valid date.');
            return;
        }

        // Get user's country and life expectancy
        const userCountry = await getUserCountry();
        const countryData = lifespanData.countries[userCountry] || lifespanData.defaults;
        const lifeExpectancyYears = countryData.lifeExpectancy ? countryData.lifeExpectancy.male : countryData.globalAverage; // Use male data or global average
        const actualLifespanInDays = lifeExpectancyYears * 365.25; // Account for leap years

        const dob = new Date(dobValue + 'T00:00:00'); // Default time to 12:00 AM
        const now = new Date();

        if (isNaN(dob.getTime())) {
            alert('Please enter a valid date.');
            return;
        }

        // Clear previous results
        mainAgeDiv.innerHTML = '';
        timelineBreakdownDiv.innerHTML = '';
        birthdayCountdownDiv.innerHTML = '';
        zodiacInfoDiv.innerHTML = '';
        dayBornDiv.innerHTML = '';
        historicalFactsDiv.innerHTML = '';

        // Detailed Age Breakdown
        let ageInYears = now.getFullYear() - dob.getFullYear();
        let ageInMonths = now.getMonth() - dob.getMonth();
        let ageInDays = now.getDate() - dob.getDate();

        if (ageInDays < 0) {
            ageInMonths--;
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
            ageInDays = lastDayOfMonth + ageInDays;
        }

        if (ageInMonths < 0) {
            ageInYears--;
            ageInMonths = 12 + ageInMonths;
        }

        let totalMonths = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
        if (now.getDate() < dob.getDate()) {
            totalMonths--;
        }

        const totalWeeks = Math.floor((now - dob) / (7 * 24 * 60 * 60 * 1000));
        const totalDays = Math.floor((now - dob) / (24 * 60 * 60 * 1000));
        const totalHours = Math.floor((now - dob) / (60 * 60 * 1000));
        const totalMinutes = Math.floor((now - dob) / (60 * 1000));
        const totalSeconds = Math.floor((now - dob) / 1000);

        mainAgeDiv.innerHTML = `
            <h3>Main Age</h3>
            <p>You are ${ageInYears} years, ${ageInMonths} months, and ${ageInDays} days old.</p>
        `;

        timelineBreakdownDiv.innerHTML = `
            <h3>Timeline Breakdown</h3>
            <p>Total Weeks: ${totalWeeks}</p>
            <p>Total Days: ${totalDays}</p>
            <p>Total Hours: ${totalHours}</p>
            <p>Total Minutes: ${totalMinutes}</p>
            <p>Total Seconds: ${totalSeconds}</p>
        `;

        // Birthday Countdown
        const nextBirthday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate(), dob.getHours(), dob.getMinutes(), dob.getSeconds());
        if (nextBirthday < now) {
            nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
        }

        const timeLeft = nextBirthday - now;
        const daysLeft = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
        const hoursLeft = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        const secondsLeft = Math.floor((timeLeft % (60 * 1000)) / 1000);

        birthdayCountdownDiv.innerHTML = `
            <h3>Countdown to Next Birthday</h3>
            <p>Days: ${daysLeft}, Hours: ${hoursLeft}, Minutes: ${minutesLeft}, Seconds: ${secondsLeft}</p>
        `;

        // Day of the Week Born
        const dayOfWeek = dob.toLocaleDateString('en-US', { weekday: 'long' });

        dayBornDiv.innerHTML = `
            <h3>Day of the Week Born</h3>
            <p>${dayOfWeek}</p>
        `;

        // Famous Birthday Twin
        const famousTwinDiv = document.getElementById('famous-twin');
        const monthValue = dob.getMonth() + 1;
        const dayValue = dob.getDate();

        fetchFamousTwin(monthValue, dayValue)
            .then(famousTwin => {
                famousTwinDiv.innerHTML = `
                    <h3>Famous Birthday Twin</h3>
                    <p>${famousTwin}</p>
                `;
            })
            .catch(error => {
                famousTwinDiv.innerHTML = `
                    <h3>Famous Birthday Twin</h3>
                    <p>Error fetching famous twin data.</p>
                `;
            });

        // Historical Events on Birth Date
        const historicalEventsDiv = document.getElementById('historical-facts');
        const birthDate = dob.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        const month = dob.getMonth() + 1;
        const day = dob.getDate();
        historicalEventsDiv.innerHTML = `
            <h3>Historical Events on ${birthDate}</h3>
            <div id="historicalEventsData">
                <p>Fetching historical events...</p>
            </div>
        `;

        fetch(`https://history.muffinlabs.com/date/${month}/${day}`)
            .then(response => response.json())
            .then(data => {
                const events = data.data.Events;
                const historicalEventsData = document.getElementById('historicalEventsData');
                historicalEventsData.innerHTML = ''; // Clear loading message

                if (events && events.length > 0) {
                    events.forEach(event => {
                        const eventParagraph = document.createElement('p');
                        eventParagraph.textContent = `${event.year}: ${event.text}`;
                        historicalEventsData.appendChild(eventParagraph);
                    });
                } else {
                    historicalEventsData.innerHTML = '<p>No notable historical events found for this date.</p>';
                }
            })
            .catch(error => {
                historicalFactsDiv.innerHTML = '<p>Error fetching historical events data.</p>';
            });

        // Calculate estimated heartbeats (using an average of 75 bpm)
        const estimatedHeartbeatsPerMinute = 75;
        const estimatedHeartbeatsPerSecond = estimatedHeartbeatsPerMinute / 60;
        const totalHeartbeats = Math.floor(totalSeconds * estimatedHeartbeatsPerSecond);

        // Calculate lifespan progress
        const lifespanProgressPercentage = (totalDays / actualLifespanInDays) * 100;

        // Update the new visualization containers
        const heartbeatGaugeDiv = document.getElementById('heartbeat-gauge-container');
        const lifespanProgressDiv = document.getElementById('lifespan-progress-container');

        // Render Lifespan Progress Bar (HTML)
        lifespanProgressDiv.innerHTML = `
            <div class="lifespan-progress-bar-container">
                <div class="lifespan-progress-bar" style="width: ${lifespanProgressPercentage.toFixed(2)}%;"></div>
            </div>
            <p>${lifespanProgressPercentage.toFixed(2)}% of an estimated ${lifeExpectancyYears.toFixed(1)}-year lifespan (based on ${userCountry || 'global average'})</p>
        `;

        // Lifespan Comparison
        const globalAverage = lifespanData.defaults.globalAverage;
        const userLifeExpectancy = lifeExpectancyYears; // Already calculated
        const difference = userLifeExpectancy - globalAverage;
        const comparisonMessage = `Your estimated lifespan is ${Math.abs(difference).toFixed(1)} years ${difference >= 0 ? 'above' : 'below'} the global average.`;

        const lifespanComparisonDiv = document.getElementById('lifespan-comparison');

        // Calculate bar widths (normalize to a max lifespan, e.g., 100 years)
        const maxLifespanForChart = 100;
        const globalAverageWidth = (globalAverage / maxLifespanForChart) * 100;
        const userLifeExpectancyWidth = (userLifeExpectancy / maxLifespanForChart) * 100;

        lifespanComparisonDiv.innerHTML = `
            <h3 class="visualization-heading">Lifespan Comparison</h3>
            <p>${comparisonMessage}</p>
            <div class="lifespan-chart-container">
                <div class="chart-bar">
                    <span class="bar-label">Global Average: ${globalAverage.toFixed(1)} yrs</span>
                    <div class="bar" style="width: ${globalAverageWidth.toFixed(2)}%;"></div>
                </div>
                <div class="chart-bar">
                    <span class="bar-label">Your Estimate: ${userLifeExpectancy.toFixed(1)} yrs</span>
                    <div class="bar" style="width: ${userLifeExpectancyWidth.toFixed(2)}%;"></div>
                </div>
            </div>
        `;

        // Future Milestones
        const futureMilestonesDiv = document.getElementById('future-milestones');
        const dobTimestamp = dob.getTime(); // Birthdate in milliseconds

        // Age 30
        const age30Date = new Date(dob.getFullYear() + 30, dob.getMonth(), dob.getDate(), dob.getHours(), dob.getMinutes(), dob.getSeconds());
        const yearsTo30 = (age30Date - now) / (365.25 * 24 * 60 * 60 * 1000);

        // Midlife (50%)
        const midlifeAge = lifeExpectancyYears * 0.5;
        const midlifeDate = new Date(dob.getFullYear() + midlifeAge, dob.getMonth(), dob.getDate(), dob.getHours(), dob.getMinutes(), dob.getSeconds());
        const yearsToMidlife = (midlifeDate - now) / (365.25 * 24 * 60 * 60 * 1000);

        // 100,000 hours old
        const hoursIn100k = 100000;
        const date100kHours = new Date(dobTimestamp + hoursIn100k * 60 * 60 * 1000);
        const daysTo100kHours = (date100kHours - now) / (24 * 60 * 60 * 1000);


        futureMilestonesDiv.innerHTML = `
            <h3 class="visualization-heading">Future Milestones</h3>
            <p>Age 30: ${yearsTo30 > 0 ? `In ${yearsTo30.toFixed(1)} years` : 'Reached!'}</p>
            <p>Midlife (${midlifeAge.toFixed(1)} years): ${yearsToMidlife > 0 ? `In ${yearsToMidlife.toFixed(1)} years` : 'Reached!'}</p>
            <p>100,000 hours old: ${daysTo100kHours > 0 ? `In ${daysTo100kHours.toFixed(0)} days` : 'Reached!'}</p>
        `;

        // Life in Units (Bonus Modules)
        const lifeInUnitsDiv = document.getElementById('life-in-units');

        // Cups of coffee consumed (assuming 2 cups per day after age 18)
        const ageAt18InDays = 18 * 365.25;
        const daysSince18 = Math.max(0, totalDays - ageAt18InDays);
        const estimatedCoffeeCups = Math.floor(daysSince18 * 2); // 2 cups per day assumption

        // Hours spent asleep (assuming 8 hours per day)
        const estimatedHoursAsleep = Math.floor(totalDays * 8);

        lifeInUnitsDiv.innerHTML = `
            <h3 class="visualization-heading">Life in Units</h3>
            <p>Estimated Cups of Coffee Consumed ☕: ${estimatedCoffeeCups.toLocaleString()}</p>
            <p>Estimated Hours Spent Asleep 😴: ${estimatedHoursAsleep.toLocaleString()}</p>
        `;


        // Zodiac Signs
        const westernZodiac = getWesternZodiac(dob.getMonth() + 1, dob.getDate());
        const chineseZodiac = getChineseZodiac(dob.getFullYear());

        const westernZodiacEmoji = getZodiacEmoji(westernZodiac);
        const chineseZodiacEmoji = getChineseZodiacEmoji(chineseZodiac);

        zodiacInfoDiv.innerHTML = `
            <h3>Zodiac Signs ${westernZodiacEmoji} ${chineseZodiacEmoji}</h3> <!-- Added emojis to title -->
            <p>Western Zodiac: ${westernZodiac}</p>
            <p>Chinese Zodiac: ${chineseZodiac}</p>
        `;


        // Show the results section
        resultsSection.style.display = 'grid';

        addVisualizationInteractivity();

        // Animate number, gauge arc, and needle for the retro gauge
        const heartbeatValue = totalHeartbeats; // Use the calculated value
        const maxHeartbeats = 4000000000; // approx for 80 years

        // Animate number
        const valueElem = document.getElementById('gaugeValue');
        if (valueElem) {
            let current = 0;
            const duration = 1500;
            const start = performance.now();

            function animateValue(timestamp) {
                const progress = Math.min((timestamp - start) / duration, 1);
                const eased = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
                const value = Math.floor(eased * heartbeatValue);
                valueElem.textContent = value.toLocaleString();
                if (progress < 1) requestAnimationFrame(animateValue);
            }
            requestAnimationFrame(animateValue);
        }


        // Animate gauge arc
        const fill = document.getElementById('gaugeFill');
        if (fill) {
            const percent = heartbeatValue / maxHeartbeats;
            const offset = 283 * (1 - percent);
            // Use a slight delay or ensure the element is visible before animating
            setTimeout(() => {
                 fill.style.strokeDashoffset = offset;
            }, 100); // Small delay
        }


        // Animate needle
        const needle = document.getElementById('needle');
        if (needle) {
            const percent = heartbeatValue / maxHeartbeats;
            const angle = 180 * percent - 90; // Map percent to -90° to +90°
             // Use a slight delay or ensure the element is visible before animating
            setTimeout(() => {
                needle.style.transform = `rotate(${angle}deg)`;
            }, 100); // Small delay
        }

        displayLifeExpectancy(); // Call the new function here
    });

    function addVisualizationInteractivity() {
        // Add interactivity for progress bar
        const lifespanProgressBarContainer = document.querySelector('.lifespan-progress-bar-container');
        const lifespanProgressDiv = document.getElementById('lifespan-progress-container'); // Get the container again
        const lifespanProgressText = lifespanProgressDiv ? lifespanProgressDiv.querySelector('p') : null; // Select the paragraph below the bar
        const initialLifespanProgressText = lifespanProgressText ? lifespanProgressText.textContent : '';
        const averageLifespanInDays = 80 * 365.25;
        // Recalculate totalDays or pass it if needed, assuming totalDays is available in this scope
        // For now, let's assume totalDays is accessible or recalculate based on dobInput
        const dobValue = document.getElementById('dob').value;
        const dob = new Date(dobValue + 'T00:00:00');
        const now = new Date();
        const totalDays = Math.floor((now - dob) / (24 * 60 * 60 * 1000));
        const lifespanProgressPercentage = (totalDays / averageLifespanInDays) * 100;


        if (lifespanProgressBarContainer && lifespanProgressText) {
             lifespanProgressBarContainer.addEventListener('mouseover', () => {
                lifespanProgressText.textContent = `Progress: ${lifespanProgressPercentage.toFixed(2)}%`;
            });
            lifespanProgressBarContainer.addEventListener('mouseout', () => {
                lifespanProgressText.textContent = initialLifespanProgressText; // Revert to the animated value shown
            });
        }
    }


    function getWesternZodiac(month, day) {
        if ((month == 1 && day <= 20) || (month == 12 && day >= 22)) {
            return "Capricorn";
        } else if ((month == 1 && day >= 21) || (month == 2 && day <= 18)) {
            return "Aquarius";
        } else if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) {
            return "Pisces";
        } else if ((month == 3 && day >= 21) || (month == 4 && day <= 20)) {
            return "Aries";
        } else if ((month == 4 && day >= 21) || (month == 5 && day <= 20)) {
            return "Taurus";
        } else if ((month == 5 && day >= 21) || (month == 6 && day <= 21)) {
            return "Gemini";
        } else if ((month == 6 && day >= 22) || (month == 7 && day <= 22)) {
            return "Cancer";
        } else if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) {
            return "Leo";
        } else if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) {
            return "Virgo";
        } else if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) {
            return "Libra";
        } else if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) {
            return "Scorpio";
        } else if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) {
            return "Sagittarius";
        }
        return "Unknown";
    }

    function getChineseZodiac(year) {
        const zodiacs = ["Monkey", "Rooster", "Dog", "Pig", "Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat"];
        return zodiacs[year % 12];
    }

    function getChineseZodiacEmoji(zodiac) {
        switch (zodiac) {
            case "Monkey": return "🐒";
            case "Rooster": return "🐓";
            case "Dog": return "🐕";
            case "Pig": return "🐖";
            case "Rat": return "🐀";
            case "Ox": return "🐂";
            case "Tiger": return "🐅";
            case "Rabbit": return "";
            case "Dragon": return "🐉";
            case "Snake": return "🐍";
            case "Horse": return "🐎";
            case "Goat": return "🐐";
            default: return "";
        }
    }


    async function queryWikidata(month, day) {
        const sparqlQuery = `
        SELECT ?item ?itemLabel WHERE {
          ?item wdt:P31 wd:Q5 .
          ?item wdt:P569 ?birthDate .
          FILTER (MONTH(?birthDate) = ${month} && DAY(?birthDate) = ${day})
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
        LIMIT 1
        `;

        const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
                console.error("Wikidata API Error:", response.status, response.statusText);
                return `Wikidata API Error: ${response.status} ${response.statusText}`;
            }

            const data = await response.json();

            if (data && data.results && data.results.bindings && data.results.bindings.length > 0) {
                const firstResult = data.results.bindings[0];
                console.log("Wikidata Result:", firstResult);
                return firstResult.itemLabel.value;
            } else {
                console.log("No famous twin found on Wikidata!");
                return "You’re unique — no twin could match your vibe today 💅✨";
            }
        } catch (error) {
            console.error("Error querying Wikidata:", error);
            return "You’re unique — no twin could match your vibe today 💅✨";
        }
    }

    async function fetchFamousTwin(month, day) {
        const result = await queryWikidata(month, day);
        if (result.startsWith("Wikidata API Error")) {
            return "You’re unique — no twin could match your vibe today 💅✨";
        }
        return result;
    }

    // Download PDF Functionality
    const downloadButton = document.getElementById('downloadPdfButton');

    downloadButton.addEventListener('click', function() {
        console.log('Download button clicked!');
        const content = document.querySelector('.results-section');

        if (typeof html2pdf === 'function') {
            console.log('html2pdf is available');
            try {
                html2pdf().set({
                    margin: 10,
                    filename: 'ChronoScope_Results.pdf',
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                }).from(content).save();
            } catch (error) {
                console.error('Error generating PDF:', error);
            }
        } else {
            console.log('html2pdf is not available');
        }
    });

    // Theme Button Logic
    const body = document.body;
    const defaultThemeButton = document.getElementById('theme-default');
    const darkThemeButton = document.getElementById('theme-dark');
    const retroThemeButton = document.getElementById('theme-retro');
    const sciFiThemeButton = document.getElementById('theme-sci-fi');

    // Load saved theme from localStorage or default to 'default'
    let currentTheme = localStorage.getItem('theme') || 'default';
    applyTheme(currentTheme);

    defaultThemeButton.addEventListener('click', function() {
        applyTheme('default');
        localStorage.setItem('theme', 'default');
    });

    darkThemeButton.addEventListener('click', function() {
        applyTheme('dark-mode');
        localStorage.setItem('theme', 'dark-mode');
    });

    retroThemeButton.addEventListener('click', function() {
        applyTheme('retro-theme');
        localStorage.setItem('theme', 'retro-theme');
    });

    sciFiThemeButton.addEventListener('click', function() {
        applyTheme('sci-fi-theme');
        localStorage.setItem('theme', 'sci-fi-theme');
    });


    function applyTheme(theme) {
        // Get the theme link elements
        const retroThemeLink = document.getElementById('retro-theme-link');
        const sciFiThemeLink = document.getElementById('sci-fi-theme-link');

        // Disable all theme stylesheets first
        if (retroThemeLink) retroThemeLink.disabled = true;
        if (sciFiThemeLink) sciFiThemeLink.disabled = true;

        // Remove all theme classes from the body
        body.classList.remove('dark-mode', 'retro-theme', 'sci-fi-theme');

        // Apply the selected theme
        if (theme === 'dark-mode') {
            body.classList.add('dark-mode');
            // Note: dark-mode styles are likely in style.css
        } else if (theme === 'retro-theme') {
            body.classList.add('retro-theme');
            if (retroThemeLink) retroThemeLink.disabled = false;
        } else if (theme === 'sci-fi-theme') {
            body.classList.add('sci-fi-theme');
            if (sciFiThemeLink) sciFiThemeLink.disabled = false;
        }
        // 'default' theme has no specific class and uses style.css
    }

    // Life Expectancy Data (Embedded JSON)
    const lifespanData = {
      "meta": {
        "version": "1.1",
        "source": "Compiled from various public data sources (WHO, World Bank, Worldometer, Worlddata.info estimates)",
        "lastUpdated": "2025-05-19"
      },
      "countries": {
        "Afghanistan": {
          "lifeExpectancy": {
            "male": 64.5,
            "female": 67.5
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Improving access to healthcare is crucial for increasing life expectancy.",
              "impactYears": 4
            },
            "nutrition": {
              "message": "Ensuring adequate nutrition supports better health outcomes.",
              "impactYears": 3
            },
            "sanitation": {
              "message": "Improving sanitation and hygiene contributes to longer lives.",
              "impactYears": 3
            },
            "preventativeCare": {
              "message": "Regular preventative health measures can improve health.",
              "impactYears": 2
            }
          }
        },
        "Albania": {
          "lifeExpectancy": {
            "male": 77.9,
            "female": 81.6
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "exercise": {
              "message": "Regular exercise supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Algeria": {
          "lifeExpectancy": {
            "male": 75.1,
            "female": 77.9
          },
          "nudges": {
            "diet": {
              "message": "A balanced diet contributes to a longer life.",
              "impactYears": 4
            },
            "exercise": {
              "message": "Staying active supports increased lifespan.",
              "impactYears": 3
            }
          }
        },
        "Andorra": {
          "lifeExpectancy": {
            "male": 82.3,
            "female": 86.2
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Maintaining a healthy lifestyle contributes to high life expectancy.",
              "impactYears": 5
            },
             "stress": {
              "message": "Managing stress can positively impact your lifespan.",
              "impactYears": 3
            }
          }
        },
        "Angola": {
          "lifeExpectancy": {
            "male": 62.5,
            "female": 65.5
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Improving access to healthcare is vital for increasing life expectancy.",
              "impactYears": 4
            },
            "sanitation": {
              "message": "Better sanitation practices are linked to longer lives.",
              "impactYears": 3
            }
          }
        },
        "Argentina": {
          "lifeExpectancy": {
            "male": 74.8,
            "female": 79.9
          },
          "nudges": {
            "diet": {
              "message": "A balanced diet supports a longer life.",
              "impactYears": 4
            },
            "exercise": {
              "message": "Regular physical activity contributes to increased lifespan.",
              "impactYears": 3
            }
          }
        },
         "Australia": {
          "lifeExpectancy": {
            "male": 81.1,
            "female": 85.1
          },
          "nudges": {
            "exercise": {
              "message": "Regular physical activity is a key factor in higher life expectancy.",
              "impactYears": 5
            },
            "sunProtection": {
              "message": "Protecting yourself from the sun reduces health risks.",
              "impactYears": 2
            },
             "diet": {
              "message": "Eating a nutritious diet supports a longer, healthier life.",
              "impactYears": 4
            }
          }
        },
        "Austria": {
          "lifeExpectancy": {
            "male": 79.8,
            "female": 84.5
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "exercise": {
              "message": "Regular exercise supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Bangladesh": {
          "lifeExpectancy": {
            "male": 73.0,
            "female": 76.4
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Access to healthcare improves health and longevity.",
              "impactYears": 3
            },
            "sanitation": {
              "message": "Better sanitation practices are linked to longer lives.",
              "impactYears": 3
            },
             "nutrition": {
              "message": "Adequate nutrition is vital for increasing life expectancy.",
              "impactYears": 4
            }
          }
        },
        "Belarus": {
          "lifeExpectancy": {
            "male": 70.5,
            "female": 80.2
          },
          "nudges": {
            "alcohol": {
              "message": "Reducing alcohol consumption can significantly increase lifespan.",
              "impactYears": 5
            },
            "smoking": {
              "message": "Quitting smoking has a major positive impact on life expectancy.",
              "impactYears": 8
            }
          }
        },
        "Belgium": {
          "lifeExpectancy": {
            "male": 80.1,
            "female": 84.5
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "exercise": {
              "message": "Regular exercise supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Benin": {
          "lifeExpectancy": {
            "male": 59.3,
            "female": 62.2
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Improving access to healthcare is vital for increasing life expectancy.",
              "impactYears": 4
            },
            "sanitation": {
              "message": "Better sanitation practices are linked to longer lives.",
              "impactYears": 3
            }
          }
        },
        "Bolivia": {
          "lifeExpectancy": {
            "male": 66.1,
            "female": 71.1
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Access to healthcare improves health and longevity.",
              "impactYears": 3
            },
            "nutrition": {
              "message": "Ensuring adequate nutrition supports better health outcomes.",
              "impactYears": 3
            }
          }
        },
        "Bosnia and Herzegovina": {
          "lifeExpectancy": {
            "male": 75.2,
            "female": 80.7
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "smoking": {
              "message": "Quitting smoking can add significant years to your life expectancy.",
              "impactYears": 7
            }
          }
        },
        "Brazil": {
          "lifeExpectancy": {
            "male": 72.8,
            "female": 79.0
          },
          "nudges": {
            "diet": {
              "message": "A healthy diet can improve your life expectancy.",
              "impactYears": 4
            },
            "exercise": {
              "message": "Staying active contributes to a longer life.",
              "impactYears": 3
            },
             "smoking": {
              "message": "Quitting smoking has significant health benefits.",
              "impactYears": 7
            }
          }
        },
        "Bulgaria": {
          "lifeExpectancy": {
            "male": 71.7,
            "female": 78.5
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "smoking": {
              "message": "Quitting smoking can add significant years to your life expectancy.",
              "impactYears": 7
            }
          }
        },
        "Burkina Faso": {
          "lifeExpectancy": {
            "male": 58.9,
            "female": 63.2
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Improving access to healthcare is vital for increasing life expectancy.",
              "impactYears": 4
            },
            "nutrition": {
              "message": "Ensuring adequate nutrition supports better health outcomes.",
              "impactYears": 3
            }
          }
        },
        "Cambodia": {
          "lifeExpectancy": {
            "male": 68.0,
            "female": 73.2
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Access to healthcare improves health and longevity.",
              "impactYears": 3
            },
            "sanitation": {
              "message": "Better sanitation practices are linked to longer lives.",
              "impactYears": 3
            }
          }
        },
        "Cameroon": {
          "lifeExpectancy": {
            "male": 61.5,
            "female": 65.9
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Improving access to healthcare is vital for increasing life expectancy.",
              "impactYears": 4
            },
            "nutrition": {
              "message": "Ensuring adequate nutrition supports better health outcomes.",
              "impactYears": 3
            }
          }
        },
        "Canada": {
          "lifeExpectancy": {
            "male": 79.5,
            "female": 83.9
          },
          "nudges": {
            "exercise": {
              "message": "An active lifestyle is linked to increased longevity.",
              "impactYears": 5
            },
            "diet": {
              "message": "Following healthy eating recommendations can extend lifespan.",
              "impactYears": 4
            },
             "stress": {
              "message": "Prioritizing mental well-being contributes to a longer life.",
              "impactYears": 3
            }
          }
        },
        "Central African Republic": {
          "lifeExpectancy": {
            "male": 55.3,
            "female": 59.3
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Improving access to healthcare is crucial for increasing life expectancy.",
              "impactYears": 4
            },
            "nutrition": {
              "message": "Ensuring adequate nutrition supports better health outcomes.",
              "impactYears": 3
            }
          }
        },
        "Chad": {
          "lifeExpectancy": {
            "male": 53.2,
            "female": 57.0
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Improving access to healthcare is vital for increasing life expectancy.",
              "impactYears": 4
            },
            "nutrition": {
              "message": "Ensuring adequate nutrition supports better health outcomes.",
              "impactYears": 3
            }
          }
        },
        "Chile": {
          "lifeExpectancy": {
            "male": 79.5,
            "female": 84.3
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "diet": {
              "message": "A balanced diet contributes to a longer life.",
              "impactYears": 4
            }
          }
        },
        "China": {
          "lifeExpectancy": {
            "male": 75.2,
            "female": 80.9
          },
          "nudges": {
            "diet": {
              "message": "A balanced diet is key to a longer life.",
              "impactYears": 5
            },
            "exercise": {
              "message": "Staying active can boost your life expectancy.",
              "impactYears": 4
            },
            "smoking": {
               "message": "Avoiding smoking significantly increases lifespan.",
               "impactYears": 8
            }
          }
        },
        "Colombia": {
          "lifeExpectancy": {
            "male": 75.8,
            "female": 80.6
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "exercise": {
              "message": "Regular exercise supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Congo (Dem. Republic)": {
          "lifeExpectancy": {
            "male": 59.8,
            "female": 64.0
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Improving access to healthcare is vital for increasing life expectancy.",
              "impactYears": 4
            },
            "nutrition": {
              "message": "Ensuring adequate nutrition supports better health outcomes.",
              "impactYears": 3
            }
          }
        },
        "Costa Rica": {
          "lifeExpectancy": {
            "male": 79.1,
            "female": 83.7
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "socialConnection": {
              "message": "Strong social ties are linked to longevity.",
              "impactYears": 3
            }
          }
        },
        "Croatia": {
          "lifeExpectancy": {
            "male": 75.8,
            "female": 81.9
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "smoking": {
              "message": "Quitting smoking can add significant years to your life expectancy.",
              "impactYears": 7
            }
          }
        },
        "Cuba": {
          "lifeExpectancy": {
            "male": 76.1,
            "female": 80.8
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Access to healthcare improves health and longevity.",
              "impactYears": 4
            },
            "nutrition": {
              "message": "Ensuring adequate nutrition supports better health outcomes.",
              "impactYears": 3
            }
          }
        },
        "Cyprus": {
          "lifeExpectancy": {
            "male": 79.8,
            "female": 83.8
          },
          "nudges": {
            "mediterraneanDiet": {
              "message": "Following a Mediterranean-style diet is associated with increased lifespan.",
              "impactYears": 6
            },
            "exercise": {
              "message": "Regular exercise supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Czech Republic": {
          "lifeExpectancy": {
            "male": 77.2,
            "female": 82.8
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "smoking": {
              "message": "Quitting smoking can add significant years to your life expectancy.",
              "impactYears": 7
            }
          }
        },
        "Denmark": {
          "lifeExpectancy": {
            "male": 80.2,
            "female": 84.0
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "exercise": {
              "message": "Regular exercise supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Dominican Republic": {
          "lifeExpectancy": {
            "male": 74.5,
            "female": 79.3
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "diet": {
              "message": "A balanced diet contributes to a longer life.",
              "impactYears": 4
            }
          }
        },
        "Ecuador": {
          "lifeExpectancy": {
            "male": 74.7,
            "female": 80.1
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "exercise": {
              "message": "Regular exercise supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Egypt": {
          "lifeExpectancy": {
            "male": 69.5,
            "female": 73.8
          },
          "nudges": {
            "diet": {
              "message": "Adopting healthier eating habits can increase lifespan.",
              "impactYears": 4
            },
            "exercise": {
              "message": "Regular physical activity supports a longer life.",
              "impactYears": 3
            }
          }
        },
        "El Salvador": {
          "lifeExpectancy": {
            "male": 72.8,
            "female": 78.7
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "healthcareAccess": {
              "message": "Access to healthcare improves health and longevity.",
              "impactYears": 3
            }
          }
        },
        "Estonia": {
          "lifeExpectancy": {
            "male": 75.3,
            "female": 83.2
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "smoking": {
              "message": "Quitting smoking can add significant years to your life expectancy.",
              "impactYears": 7
            }
          }
        },
        "Ethiopia": {
          "lifeExpectancy": {
            "male": 66.0,
            "female": 69.9
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Improving access to healthcare is vital for increasing life expectancy.",
              "impactYears": 4
            },
            "nutrition": {
              "message": "Ensuring adequate nutrition supports better health outcomes.",
              "impactYears": 3
            }
          }
        },
        "Finland": {
          "lifeExpectancy": {
            "male": 79.4,
            "female": 84.8
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "exercise": {
              "message": "Regular exercise supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "France": {
          "lifeExpectancy": {
            "male": 80.1,
            "female": 85.9
          },
          "nudges": {
            "diet": {
              "message": "A balanced diet contributes to a long and healthy life.",
              "impactYears": 5
            },
            "socialConnection": {
              "message": "Maintaining strong social ties is linked to increased longevity.",
              "impactYears": 3
            },
             "exercise": {
              "message": "Regular physical activity supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Germany": {
          "lifeExpectancy": {
            "male": 78.2,
            "female": 83.0
          },
          "nudges": {
            "exercise": {
              "message": "Regular physical activity is vital for a long and healthy life.",
              "impactYears": 5
            },
            "alcohol": {
              "message": "Moderate alcohol intake is recommended for better health outcomes.",
              "impactYears": 3
            },
             "smoking": {
              "message": "Quitting smoking is one of the best ways to increase lifespan.",
              "impactYears": 8
            }
          }
        },
        "Ghana": {
          "lifeExpectancy": {
            "male": 63.2,
            "female": 66.1
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Improving access to healthcare is vital for increasing life expectancy.",
              "impactYears": 4
            },
            "nutrition": {
              "message": "Ensuring adequate nutrition supports better health outcomes.",
              "impactYears": 3
            }
          }
        },
        "Greece": {
          "lifeExpectancy": {
            "male": 79.5,
            "female": 84.5
          },
          "nudges": {
            "mediterraneanDiet": {
              "message": "Following a Mediterranean-style diet is associated with increased lifespan.",
              "impactYears": 6
            },
            "lifestyle": {
              "message": "An active and social lifestyle is key to longevity.",
              "impactYears": 4
            }
          }
        },
        "Guatemala": {
          "lifeExpectancy": {
            "male": 70.0,
            "female": 74.0
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Access to healthcare improves health and longevity.",
              "impactYears": 3
            },
            "nutrition": {
              "message": "Ensuring adequate nutrition supports better health outcomes.",
              "impactYears": 3
            }
          }
        },
        "Guinea": {
          "lifeExpectancy": {
            "male": 59.5,
            "female": 61.9
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Improving access to healthcare is vital for increasing life expectancy.",
              "impactYears": 4
            },
            "sanitation": {
              "message": "Better sanitation practices are linked to longer lives.",
              "impactYears": 3
            }
          }
        },
        "Haiti": {
          "lifeExpectancy": {
            "male": 61.7,
            "female": 68.3
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Improving access to healthcare is crucial for increasing life expectancy.",
              "impactYears": 4
            },
            "nutrition": {
              "message": "Ensuring adequate nutrition supports better health outcomes.",
              "impactYears": 3
            }
          }
        },
        "Honduras": {
          "lifeExpectancy": {
            "male": 71.8,
            "female": 76.3
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "healthcareAccess": {
              "message": "Access to healthcare improves health and longevity.",
              "impactYears": 3
            }
          }
        },
        "Hungary": {
          "lifeExpectancy": {
            "male": 72.5,
            "female": 79.5
          },
          "nudges": {
            "smoking": {
              "message": "Quitting smoking can add significant years to your life expectancy.",
              "impactYears": 7
            },
            "alcohol": {
              "message": "Reducing alcohol consumption can significantly increase lifespan.",
              "impactYears": 5
            }
          }
        },
        "Iceland": {
          "lifeExpectancy": {
            "male": 81.8,
            "female": 84.5
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Maintaining a healthy lifestyle contributes to high life expectancy.",
              "impactYears": 5
            },
             "stress": {
              "message": "Managing stress can positively impact your lifespan.",
              "impactYears": 3
            }
          }
        },
        "India": {
          "lifeExpectancy": {
            "male": 70.5,
            "female": 73.6
          },
          "nudges": {
            "diet": {
              "message": "A healthy diet may add several years to your life expectancy.",
              "impactYears": 5
            },
            "stress": {
              "message": "Reducing stress can positively impact your lifespan.",
              "impactYears": 3
            },
            "exercise": {
               "message": "Regular exercise can increase your life expectancy.",
               "impactYears": 4
            }
          }
        },
        "Indonesia": {
          "lifeExpectancy": {
            "male": 69.0,
            "female": 73.3
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Improving access to healthcare can increase life expectancy.",
              "impactYears": 3
            },
            "diet": {
              "message": "A balanced diet supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Iran": {
          "lifeExpectancy": {
            "male": 76.2,
            "female": 79.9
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "diet": {
              "message": "A balanced diet contributes to a longer life.",
              "impactYears": 4
            }
          }
        },
        "Iraq": {
          "lifeExpectancy": {
            "male": 71.3,
            "female": 75.5
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Improving access to healthcare is crucial for increasing life expectancy.",
              "impactYears": 4
            },
            "nutrition": {
              "message": "Ensuring adequate nutrition supports better health outcomes.",
              "impactYears": 3
            }
          }
        },
        "Ireland": {
          "lifeExpectancy": {
            "male": 80.6,
            "female": 84.6
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "exercise": {
              "message": "Regular exercise supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Israel": {
          "lifeExpectancy": {
            "male": 80.7,
            "female": 84.8
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Maintaining a healthy lifestyle contributes to high life expectancy.",
              "impactYears": 5
            },
             "stress": {
              "message": "Managing stress can positively impact your lifespan.",
              "impactYears": 3
            }
          }
        },
        "Italy": {
          "lifeExpectancy": {
            "male": 81.7,
            "female": 85.8
          },
          "nudges": {
            "mediterraneanDiet": {
              "message": "Following a Mediterranean-style diet is associated with increased lifespan.",
              "impactYears": 6
            },
            "socialConnection": {
              "message": "Strong family and community ties contribute to longevity.",
              "impactYears": 3
            },
             "exercise": {
              "message": "Staying physically active supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Japan": {
          "lifeExpectancy": {
            "male": 81.1,
            "female": 87.1
          },
          "nudges": {
            "diet": {
              "message": "A traditional healthy diet contributes to longevity.",
              "impactYears": 6
            },
            "exercise": {
              "message": "Maintaining an active lifestyle supports a longer life.",
              "impactYears": 4
            },
             "stress": {
              "message": "Managing stress can positively impact your lifespan.",
              "impactYears": 3
            }
          }
        },
        "Jordan": {
          "lifeExpectancy": {
            "male": 75.9,
            "female": 80.3
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "diet": {
              "message": "A balanced diet contributes to a longer life.",
              "impactYears": 4
            }
          }
        },
        "Kazakhstan": {
          "lifeExpectancy": {
            "male": 70.2,
            "female": 78.4
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "smoking": {
              "message": "Quitting smoking can add significant years to your life expectancy.",
              "impactYears": 7
            }
          }
        },
        "Kenya": {
          "lifeExpectancy": {
            "male": 63.7,
            "female": 67.7
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Improving access to healthcare is vital for increasing life expectancy.",
              "impactYears": 4
            },
            "nutrition": {
              "message": "Ensuring adequate nutrition supports better health outcomes.",
              "impactYears": 3
            }
          }
        },
        "Kuwait": {
          "lifeExpectancy": {
            "male": 80.8,
            "female": 82.1
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Maintaining a healthy lifestyle contributes to high life expectancy.",
              "impactYears": 5
            },
             "exercise": {
              "message": "Regular exercise supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Lebanon": {
          "lifeExpectancy": {
            "male": 75.9,
            "female": 79.9
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "stress": {
              "message": "Managing stress can positively impact your lifespan.",
              "impactYears": 3
            }
          }
        },
        "Liberia": {
          "lifeExpectancy": {
            "male": 60.9,
            "female": 63.4
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Improving access to healthcare is vital for increasing life expectancy.",
              "impactYears": 4
            },
            "sanitation": {
              "message": "Better sanitation practices are linked to longer lives.",
              "impactYears": 3
            }
          }
        },
        "Libya": {
          "lifeExpectancy": {
            "male": 72.8,
            "female": 77.0
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Access to healthcare improves health and longevity.",
              "impactYears": 3
            },
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            }
          }
        },
        "Lithuania": {
          "lifeExpectancy": {
            "male": 71.6,
            "female": 80.6
          },
          "nudges": {
            "alcohol": {
              "message": "Reducing alcohol consumption can significantly increase lifespan.",
              "impactYears": 5
            },
            "smoking": {
              "message": "Quitting smoking has a major positive impact on life expectancy.",
              "impactYears": 8
            }
          }
        },
        "Luxembourg": {
          "lifeExpectancy": {
            "male": 80.8,
            "female": 83.9
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Maintaining a healthy lifestyle contributes to high life expectancy.",
              "impactYears": 5
            },
             "exercise": {
              "message": "Regular exercise supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Malaysia": {
          "lifeExpectancy": {
            "male": 74.5,
            "female": 79.5
          },
          "nudges": {
            "diet": {
              "message": "A balanced diet contributes to a longer life.",
              "impactYears": 4
            },
            "exercise": {
              "message": "Staying active supports increased lifespan.",
              "impactYears": 3
            }
          }
        },
        "Mali": {
          "lifeExpectancy": {
            "male": 59.0,
            "female": 61.9
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Improving access to healthcare is vital for increasing life expectancy.",
              "impactYears": 4
            },
            "nutrition": {
              "message": "Ensuring adequate nutrition supports better health outcomes.",
              "impactYears": 3
            }
          }
        },
        "Malta": {
          "lifeExpectancy": {
            "male": 81.5,
            "female": 85.4
          },
          "nudges": {
            "mediterraneanDiet": {
              "message": "Following a Mediterranean-style diet is associated with increased lifespan.",
              "impactYears": 6
            },
            "exercise": {
              "message": "Regular exercise supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Mexico": {
          "lifeExpectancy": {
            "male": 72.2,
            "female": 77.8
          },
          "nudges": {
            "diet": {
              "message": "Adopting healthier eating habits can increase lifespan.",
              "impactYears": 4
            },
            "exercise": {
              "message": "Regular physical activity supports a longer life.",
              "impactYears": 3
            },
             "stress": {
              "message": "Managing stress is important for long-term health.",
              "impactYears": 2
            }
          }
        },
        "Moldova": {
          "lifeExpectancy": {
            "male": 69.3,
            "female": 77.3
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "alcohol": {
              "message": "Reducing alcohol consumption can significantly increase lifespan.",
              "impactYears": 5
            }
          }
        },
        "Monaco": {
          "lifeExpectancy": {
            "male": 84.6,
            "female": 88.6
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Maintaining a healthy lifestyle contributes to the world's highest life expectancy.",
              "impactYears": 5
            },
             "healthcareAccess": {
              "message": "Access to excellent healthcare supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Montenegro": {
          "lifeExpectancy": {
            "male": 73.9,
            "female": 80.5
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "exercise": {
              "message": "Regular exercise supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Morocco": {
          "lifeExpectancy": {
            "male": 73.5,
            "female": 77.9
          },
          "nudges": {
            "diet": {
              "message": "A balanced diet contributes to a longer life.",
              "impactYears": 4
            },
            "exercise": {
              "message": "Staying active supports increased lifespan.",
              "impactYears": 3
            }
          }
        },
        "Mozambique": {
          "lifeExpectancy": {
            "male": 60.7,
            "female": 64.7
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Improving access to healthcare is vital for increasing life expectancy.",
              "impactYears": 4
            },
            "nutrition": {
              "message": "Ensuring adequate nutrition supports better health outcomes.",
              "impactYears": 3
            }
          }
        },
        "Nepal": {
          "lifeExpectancy": {
            "male": 68.8,
            "female": 71.8
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Access to healthcare improves health and longevity.",
              "impactYears": 3
            },
            "sanitation": {
              "message": "Better sanitation practices are linked to longer lives.",
              "impactYears": 3
            }
          }
        },
        "Netherlands": {
          "lifeExpectancy": {
            "male": 80.7,
            "female": 83.8
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "exercise": {
              "message": "Regular exercise supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "New Zealand": {
          "lifeExpectancy": {
            "male": 80.6,
            "female": 83.9
          },
          "nudges": {
            "exercise": {
              "message": "An active lifestyle is linked to increased longevity.",
              "impactYears": 5
            },
            "diet": {
              "message": "Following healthy eating recommendations can extend lifespan.",
              "impactYears": 4
            }
          }
        },
        "Niger": {
          "lifeExpectancy": {
            "male": 60.3,
            "female": 62.1
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Improving access to healthcare is vital for increasing life expectancy.",
              "impactYears": 4
            },
            "nutrition": {
              "message": "Ensuring adequate nutrition supports better health outcomes.",
              "impactYears": 3
            }
          }
        },
        "Nigeria": {
          "lifeExpectancy": {
            "male": 54.2,
            "female": 54.7
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Accessing regular healthcare check-ups can improve health outcomes.",
              "impactYears": 3
            },
            "sanitation": {
              "message": "Improving sanitation practices contributes to better health and longevity.",
              "impactYears": 3
            },
             "nutrition": {
              "message": "Ensuring adequate nutrition is vital for increasing life expectancy.",
              "impactYears": 4
            }
          }
        },
        "North Macedonia": {
          "lifeExpectancy": {
            "male": 75.3,
            "female": 79.7
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "smoking": {
              "message": "Quitting smoking can add significant years to your life expectancy.",
              "impactYears": 7
            }
          }
        },
        "Norway": {
          "lifeExpectancy": {
            "male": 81.9,
            "female": 85.0
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Maintaining a healthy lifestyle contributes to high life expectancy.",
              "impactYears": 5
            },
             "exercise": {
              "message": "Regular exercise supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Oman": {
          "lifeExpectancy": {
            "male": 78.7,
            "female": 82.0
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "diet": {
              "message": "A balanced diet contributes to a longer life.",
              "impactYears": 4
            }
          }
        },
        "Pakistan": {
          "lifeExpectancy": {
            "male": 65.3,
            "female": 70.2
          },
          "nudges": {
            "smoking": {
              "message": "Quitting smoking can add significant years to your life expectancy.",
              "impactYears": 7
            },
            "exercise": {
              "message": "Regular exercise can increase your life expectancy.",
              "impactYears": 4
            },
            "diet": {
              "message": "A healthy diet may add several years to your life expectancy.",
              "impactYears": 5
            }
          }
        },
        "Panama": {
          "lifeExpectancy": {
            "male": 76.9,
            "female": 82.7
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "exercise": {
              "message": "Regular exercise supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Paraguay": {
          "lifeExpectancy": {
            "male": 71.7,
            "female": 76.3
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "diet": {
              "message": "A balanced diet contributes to a longer life.",
              "impactYears": 4
            }
          }
        },
        "Peru": {
          "lifeExpectancy": {
            "male": 75.6,
            "female": 80.3
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "nutrition": {
              "message": "Ensuring adequate nutrition supports better health outcomes.",
              "impactYears": 3
            }
          }
        },
        "Philippines": {
          "lifeExpectancy": {
            "male": 66.9,
            "female": 72.8
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Access to healthcare improves health and longevity.",
              "impactYears": 3
            },
            "diet": {
              "message": "A balanced diet supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Poland": {
          "lifeExpectancy": {
            "male": 75.1,
            "female": 82.5
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "smoking": {
              "message": "Quitting smoking can add significant years to your life expectancy.",
              "impactYears": 7
            }
          }
        },
        "Portugal": {
          "lifeExpectancy": {
            "male": 79.7,
            "female": 85.3
          },
          "nudges": {
            "mediterraneanDiet": {
              "message": "Following a Mediterranean-style diet is associated with increased lifespan.",
              "impactYears": 6
            },
            "exercise": {
              "message": "Regular exercise supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Qatar": {
          "lifeExpectancy": {
            "male": 81.8,
            "female": 83.5
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Maintaining a healthy lifestyle contributes to high life expectancy.",
              "impactYears": 5
            },
             "exercise": {
              "message": "Regular exercise supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Romania": {
          "lifeExpectancy": {
            "male": 72.7,
            "female": 79.8
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "smoking": {
              "message": "Quitting smoking can add significant years to your life expectancy.",
              "impactYears": 7
            }
          }
        },
        "Russia": {
          "lifeExpectancy": {
            "male": 68.0,
            "female": 78.7
          },
          "nudges": {
            "alcohol": {
              "message": "Reducing alcohol consumption can significantly increase lifespan.",
              "impactYears": 5
            },
            "smoking": {
              "message": "Quitting smoking has a major positive impact on life expectancy.",
              "impactYears": 8
            },
             "diet": {
              "message": "Improving dietary habits supports a longer life.",
              "impactYears": 3
            }
          }
        },
        "Saudi Arabia": {
          "lifeExpectancy": {
            "male": 77.3,
            "female": 81.3
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "diet": {
              "message": "A balanced diet contributes to a longer life.",
              "impactYears": 4
            }
          }
        },
        "Serbia": {
          "lifeExpectancy": {
            "male": 73.7,
            "female": 80.2
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "smoking": {
              "message": "Quitting smoking can add significant years to your life expectancy.",
              "impactYears": 7
            }
          }
        },
        "Sierra Leone": {
          "lifeExpectancy": {
            "male": 60.1,
            "female": 63.5
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Improving access to healthcare is vital for increasing life expectancy.",
              "impactYears": 4
            },
            "sanitation": {
              "message": "Better sanitation practices are linked to longer lives.",
              "impactYears": 3
            }
          }
        },
        "Singapore": {
          "lifeExpectancy": {
            "male": 81.4,
            "female": 86.4
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Maintaining a healthy lifestyle contributes to high life expectancy.",
              "impactYears": 5
            },
             "healthcareAccess": {
              "message": "Access to excellent healthcare supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Slovakia": {
          "lifeExpectancy": {
            "male": 75.2,
            "female": 81.7
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "smoking": {
              "message": "Quitting smoking can add significant years to your life expectancy.",
              "impactYears": 7
            }
          }
        },
        "Slovenia": {
          "lifeExpectancy": {
            "male": 79.1,
            "female": 84.5
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "exercise": {
              "message": "Regular exercise supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Somalia": {
          "lifeExpectancy": {
            "male": 56.4,
            "female": 61.4
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Improving access to healthcare is crucial for increasing life expectancy.",
              "impactYears": 4
            },
            "nutrition": {
              "message": "Ensuring adequate nutrition supports better health outcomes.",
              "impactYears": 3
            }
          }
        },
        "South Africa": {
          "lifeExpectancy": {
            "male": 62.6,
            "female": 69.6
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Regular health screenings are important for early detection and better outcomes.",
              "impactYears": 3
            },
            "healthyLifestyle": {
              "message": "Adopting a generally healthy lifestyle can significantly increase lifespan.",
              "impactYears": 5
            },
             "stress": {
              "message": "Managing stress is crucial for long-term health.",
              "impactYears": 2
            }
          }
        },
        "South Korea": {
          "lifeExpectancy": {
            "male": 80.6,
            "female": 86.4
          },
          "nudges": {
            "diet": {
              "message": "A healthy diet contributes to high life expectancy.",
              "impactYears": 5
            },
            "healthcare": {
              "message": "Access to quality healthcare supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Spain": {
          "lifeExpectancy": {
            "male": 81.2,
            "female": 86.7
          },
          "nudges": {
            "mediterraneanDiet": {
              "message": "Embracing the Mediterranean diet can significantly boost life expectancy.",
              "impactYears": 6
            },
            "lifestyle": {
              "message": "An active and social lifestyle is key to longevity.",
              "impactYears": 4
            }
          }
        },
        "Sri Lanka": {
          "lifeExpectancy": {
            "male": 74.5,
            "female": 80.8
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Access to healthcare improves health and longevity.",
              "impactYears": 3
            },
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            }
          }
        },
        "Sudan": {
          "lifeExpectancy": {
            "male": 63.3,
            "female": 69.6
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Improving access to healthcare is crucial for increasing life expectancy.",
              "impactYears": 4
            },
            "sanitation": {
              "message": "Better sanitation practices are linked to longer lives.",
              "impactYears": 3
            }
          }
        },
        "Sweden": {
          "lifeExpectancy": {
            "male": 81.7,
            "female": 85.0
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Maintaining a healthy lifestyle contributes to high life expectancy.",
              "impactYears": 5
            },
             "exercise": {
              "message": "Regular exercise supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Switzerland": {
          "lifeExpectancy": {
            "male": 82.2,
            "female": 85.9
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Maintaining a healthy lifestyle contributes to high life expectancy.",
              "impactYears": 5
            },
             "healthcareAccess": {
              "message": "Access to excellent healthcare supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "Thailand": {
          "lifeExpectancy": {
            "male": 72.6,
            "female": 81.0
          },
          "nudges": {
            "diet": {
              "message": "A balanced diet contributes to a longer life.",
              "impactYears": 4
            },
            "exercise": {
              "message": "Staying active supports increased lifespan.",
              "impactYears": 3
            }
          }
        },
        "Togo": {
          "lifeExpectancy": {
            "male": 62.5,
            "female": 62.9
          },
          "nudges": {
            "healthcareAccess": {
              "message": "Improving access to healthcare is vital for increasing life expectancy.",
              "impactYears": 4
            },
            "nutrition": {
              "message": "Ensuring adequate nutrition supports better health outcomes.",
              "impactYears": 3
            }
          }
        },
        "Turkey": {
          "lifeExpectancy": {
            "male": 74.6,
            "female": 80.3
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "diet": {
              "message": "A balanced diet contributes to a longer life.",
              "impactYears": 4
            }
          }
        },
        "Ukraine": {
          "lifeExpectancy": {
            "male": 66.9,
            "female": 80.2
          },
          "nudges": {
            "alcohol": {
              "message": "Reducing alcohol consumption can significantly increase lifespan.",
              "impactYears": 5
            },
            "smoking": {
              "message": "Quitting smoking has a major positive impact on life expectancy.",
              "impactYears": 8
            }
          }
        },
        "United Arab Emirates": {
          "lifeExpectancy": {
            "male": 82.2,
            "female": 84.3
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Maintaining a healthy lifestyle contributes to high life expectancy.",
              "impactYears": 5
            },
             "exercise": {
              "message": "Regular exercise supports a longer life.",
              "impactYears": 4
            }
          }
        },
        "United Kingdom": {
          "lifeExpectancy": {
            "male": 79.4,
            "female": 83.2
          },
          "nudges": {
            "exercise": {
              "message": "Meeting physical activity guidelines can add years to your life.",
              "impactYears": 5
            },
            "diet": {
              "message": "Eating a balanced diet supports long-term health.",
              "impactYears": 4
            },
             "smoking": {
              "message": "Stopping smoking significantly improves life expectancy.",
              "impactYears": 8
            }
          }
        },
        "United States": {
          "lifeExpectancy": {
            "male": 75.8,
            "female": 81.1
          },
          "nudges": {
            "alcohol": {
              "message": "Limiting alcohol consumption can increase lifespan.",
              "impactYears": 3
            },
            "sleep": {
              "message": "Getting enough sleep improves your life expectancy.",
              "impactYears": 3
            },
             "smoking": {
              "message": "Quitting smoking can add significant years to your life expectancy.",
              "impactYears": 8
            },
            "exercise": {
               "message": "Regular exercise can increase your life expectancy.",
               "impactYears": 5
            }
          }
        },
        "Uruguay": {
          "lifeExpectancy": {
            "male": 74.4,
            "female": 82.0
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "diet": {
              "message": "A balanced diet contributes to a longer life.",
              "impactYears": 4
            }
          }
        },
        "Vietnam": {
          "lifeExpectancy": {
            "male": 69.9,
            "female": 79.3
          },
          "nudges": {
            "healthyLifestyle": {
              "message": "Adopting a healthy lifestyle can add years to your life.",
              "impactYears": 5
            },
            "smoking": {
              "message": "Quitting smoking can add significant years to your life expectancy.",
              "impactYears": 7
            }
          }
        }
      },
      "consent": {
        "required": true,
        "message": "Please consent to see your personalized life expectancy projections. Data is based on general population statistics and health estimates from various sources and should be considered illustrative."
      },
      "defaults": {
        "globalAverage": 72.6,
        "globalNudges": {
          "healthyLifestyle": {
            "message": "Adopting a generally healthy lifestyle, including diet, exercise, and avoiding smoking, can add several years to your life.",
            "impactYears": 7
          },
           "preventativeCare": {
            "message": "Regular preventative healthcare and screenings can improve health outcomes and lifespan.",
            "impactYears": 3
           }
        }
      }
    };


    function getZodiacEmoji(zodiac) {
        switch (zodiac) {
        case "Aries": return "♈";
        case "Taurus": return "♉";
        case "Gemini": return "♊";
        case "Cancer": return "♋";
        case "Leo": return "♌";
        case "Virgo": return "♍";
        case "Libra": return "♎";
        case "Scorpio": return "♏";
        case "Sagittarius": return "♐";
        case "Capricorn": return "♑";
        case "Aquarius": return "♒";
        case "Pisces": return "♓";
        default: return "";
    }
}

// Function to fetch user's country
async function getUserCountry() {
    try {
        const response = await fetch('http://ip-api.com/json');
        const data = await response.json();
        if (data.status === 'success') {
            return data.country; // Returns country name, e.g., "United States", "Pakistan"
        }
    } catch (error) {
        console.error('Error fetching IP geolocation:', error);
    }
    return null; // Return null if detection fails
}

// Function to display life expectancy data
async function displayLifeExpectancy() {
    const consentSection = document.getElementById('consent-section');
    const projectionSection = document.getElementById('projection-section');
    const consentCheckbox = document.getElementById('consent-checkbox');
    const consentButton = document.getElementById('consent-button');
    const detectedCountrySpan = document.getElementById('detected-country');
    const baseLifespanSpan = document.getElementById('base-lifespan');
    const nudgesList = document.getElementById('nudges-list');
    const totalPotentialLifespanSpan = document.getElementById('total-potential-lifespan');

    // Check for existing consent
    const hasConsent = localStorage.getItem('chronoscopeLifeExpectancyConsent') === 'true';

    if (lifespanData.consent.required && !hasConsent) {
        // Show consent section if required and not given
        consentSection.style.display = 'block';
        projectionSection.style.display = 'none';

        consentButton.addEventListener('click', function() {
            if (consentCheckbox.checked) {
                localStorage.setItem('chronoscopeLifeExpectancyConsent', 'true');
                consentSection.style.display = 'none';
                projectionSection.style.display = 'block';
                renderLifeExpectancy();
            } else {
                alert('Please check the consent box to proceed.');
            }
        });
    } else {
        // If consent is not required or already given, show projections
        consentSection.style.display = 'none';
        projectionSection.style.display = 'block';
        renderLifeExpectancy();
    }

    async function renderLifeExpectancy() {
        const userCountry = await getUserCountry();
        const countryData = lifespanData.countries[userCountry] || lifespanData.defaults;
        const lifeExpectancy = countryData.lifeExpectancy ? countryData.lifeExpectancy.male : countryData.globalAverage; // Use male data or global average
        const nudges = countryData.nudges || lifespanData.defaults.globalNudges;

        detectedCountrySpan.textContent = userCountry || 'Unknown';
        baseLifespanSpan.textContent = lifeExpectancy.toFixed(1);

        nudgesList.innerHTML = '';
        let totalImpactYears = 0;
        for (const key in nudges) {
            if (nudges.hasOwnProperty(key)) {
                const nudge = nudges[key];
                const listItem = document.createElement('li');
                listItem.textContent = `${nudge.message} (+${nudge.impactYears} years)`;
                nudgesList.appendChild(listItem);
                totalImpactYears += nudge.impactYears;
            }
        }

        totalPotentialLifespanSpan.textContent = (lifeExpectancy + totalImpactYears).toFixed(1);
    }
}

    // Modal Logic for v2 Banner
    const v2Modal = document.getElementById('v2-modal');
    const closeButton = document.querySelector('#v2-modal .close-button');
    const modalDismissedKey = 'v2ModalDismissed';

    // Check if the modal has been dismissed before
    const hasDismissedModal = localStorage.getItem(modalDismissedKey);

    if (!hasDismissedModal) {
        // If not dismissed, show the modal
        v2Modal.style.display = 'flex';
    }

    // Add event listener to the close button
    closeButton.addEventListener('click', function() {
        v2Modal.style.display = 'none';
        // Save to local storage that the modal has been dismissed
        localStorage.setItem(modalDismissedKey, 'true');
    });

    // Close the modal if the user clicks outside of it
    window.addEventListener('click', function(event) {
        if (event.target === v2Modal) {
            v2Modal.style.display = 'none';
            // Save to local storage that the modal has been dismissed
            localStorage.setItem(modalDismissedKey, 'true');
        }
    });

});
