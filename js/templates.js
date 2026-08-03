/* ============================================================
   Peacock QuoteDesk — quotation templates & org defaults
   Three formats reproduced from the client's proformas:
   private (Costing Details) · medical · estimated (Estimated Cost)
   Everything here is a DEFAULT — all of it is editable in-app.
   ============================================================ */

const ORG_DEFAULTS = {
  coName: 'SHIVALINGAM GLOBAL AVIATION PVT LTD',
  coLine: '37A Garcha Road, Kolkata, West Bengal – 700019',
  coPhones: '+91 8444840255  /  +91 8334955561',
  coEmail: 'vikash@peacockjetlines.com',
  coWeb: 'www.peacockjetlines.com',
  brand: 'PEACOCK JETLINES',
  signFor: 'For SHIVALINGAM GLOBAL AVIATION PVT LTD (PEACOCK JETLINES)',
  signRole: 'Authorised Signatory'
};

/* Fleet shown in the aircraft dropdown. The field is a free-text input
   backed by this <datalist>, so the admin can pick one OR type any other. */
const AIRCRAFT_LIST = [
  'Legacy 500','Legacy 600','Legacy 650',
  'Praetor 600','Phenom 300E',
  'Challenger 604','Challenger 605',
  'Citation CJ1','Citation CJ2',
  'Dassault Falcon 8X','Falcon 7X','Falcon 2000LXS',
  'Global 5000','Global 5500','Global 6000','Global 6500','Global 7500',
  'G700','Gulfstream G150',
  'King Air 200','King Air 300','King Air 350',
  'Grand Caravan 208B','PC-24',
  'ERJ-145','E190-ER',
  'Akasa 737 MAX','Boeing 737','Airbus A321'
];

const TEMPLATES = {
  private: {
    label: 'Private charter',
    costTitle: 'Costing Details',
    gstDefault: 18,
    greeting: 'Dear Sir/Madam,<br>We are pleased to offer you <span data-slot="aircraft"></span>. The commercials for the same are as follows:',
    metaExtra: [],                       // no extra meta rows
    posBar: null,                        // no positioning section bar
    costs: [
      { label: 'Charter cost — all inclusive', amount: '' },
      { label: 'Airport handling & parking charges', amount: '' },
      { label: 'Crew TA-DA & night halt', amount: '' }
    ],
    notes: [
      '1. All quotations/options provided above are subject to all necessary permission and aircraft availability at the time of charter confirmation & as per the COVID protocol',
      '2. Any miscellaneous charges including watch hour extensions (if required) will be charged on actuals',
      '3. Timings to be confirmed on the basis of NOTAM and watch hours at respective Airports.',
      '4. If at Day/Night Halt Parking Is Unavailable Due to any reason, The Aircraft/Helicopter Shall Be Positioned And Parked To Nearest Airport and all associated charges will be charged Extra'
    ]
  },

  medical: {
    label: 'Medical evacuation',
    costTitle: 'Costing Details',
    gstDefault: 0,                       // GST is exempted in medical flights
    greeting: 'Dear Sir/Madam,<br>We are pleased to offer you <span data-slot="aircraft"></span>. The commercials for the same are as follows:',
    metaExtra: [
      { key: 'configuration', label: 'Configuration:' },
      { key: 'positioning',  label: 'Positioning:' }
    ],
    posBar: 'Positioning of medically equipped Aircraft',
    costs: [
      { label: '1) Total Time', amount: '' },
      { label: '2) Per Hour Tariff', amount: '' },
      { label: '3) Cost', amount: '' },
      { label: '4) Airport Charges', amount: '' },
      { label: '5) Paramedic Cost', amount: '' },
      { label: '6) Life Saving Equipments', amount: '' },
      { label: '7) Crew TA-DA', amount: '' }
    ],
    notes: [
      '1. Flying from base to any other Airport for any emergency flight will be charged additional and has to be paid in advance',
      '2. Airport Charges (Handling) charged during additional flying will be charged at actuals and as per movement of Aircraft',
      '3. Hotel Accommodation (at Star Rated Hotel) for Paramedics (02 Members) and Crew (02 Pilots + 01 Technician) will be provided by client, along with Transport',
      '4. GST is exempted in Medical Flights',
      '5. Terms & Conditions will be applicable',
      '6. 100% advance within time to Book the flight',
      '7. Any additional Parking charges if charged by airport during halt will be paid by client on actual',
      '8. Any other expenses which are not mentioned, but are charged during flight or Parking of Aircraft, will be charged and paid by client immediately.'
    ]
  },

  estimated: {
    label: 'Estimated cost',
    costTitle: 'Estimated Cost',
    gstDefault: 18,
    greeting: 'Dear Sir/Madam,<br>We are pleased to offer you <span data-slot="aircraft"></span>. The estimated commercials for the same are as follows:',
    metaExtra: [],
    posBar: null,
    costs: [
      { label: 'Estimated Charter Cost', amount: '' }
    ],
    notes: [
      '1. All quotations/options provided above are subject to all necessary permission and aircraft availability at the time of charter confirmation & as per the COVID protocol',
      '2. Any miscellaneous charges including watch hour extensions (if required) will be charged on actuals',
      '3. Timings to be confirmed on the basis of NOTAM and watch hours at respective Airports.',
      '4. If at Day/Night Halt Parking Is Unavailable Due to any reason, The Aircraft/Helicopter Shall Be Positioned And Parked To Nearest Airport and all associated charges will be charged Extra'
    ]
  }
};

/* Terms & Conditions — two A4 pages, shared by all templates (fully editable in preview) */
const TNC_PAGES = [
  [
    { head: '1. Quotation and Booking Conditions:', items: [
      '1.1. All quotations/options are subject to aircraft availability and necessary permissions at the time of charter confirmation, in adherence with COVID protocols.',
      '1.2. Miscellaneous charges, including watch hour extensions, will be charged based on actual usage.',
      '1.3. Timings are subject to NOTAM and watch hours at respective airports.',
      '1.4. If day or night halt parking is unavailable for any reason, the aircraft/helicopter will be repositioned to the nearest airport, with additional charges applied accordingly.'
    ]},
    { head: '2. Additional Terms:', items: [
      '2.1. This quotation is provisional. The charter will be confirmed upon receipt of 100% advance payment.',
      '2.2. Additional sectors requested after the commencement of the flight itinerary are at the discretion of SHIVALINGAM GLOBAL AVIATION PVT LTD (PEACOCK JETLINES).',
      '2.3. Flight duty and time will adhere to DGCA – CAR – 7 – J III & IV regulations effective from 30.09.2022.',
      '2.4. A minimum booking of 2 hours flying time per day per booking is required.',
      '2.5. Flying hours mentioned are indicative; any deviations due to weather, air route unavailability, or other official decisions will incur actual charges as billed in the final invoice.'
    ]},
    { head: '3. Payment and Cancellation:', items: [
      '3.1. 100% advance payment is required at the time of booking to confirm the charter, payable by cheque/DD/wire transfer to SHIVALINGAM GLOBAL AVIATION PVT LTD in Kolkata.',
      '<b class="redsub">3.2. Cancellation charges apply as follows:</b>',
      '3.3.1. 10% for force majeure-related cancellations.',
      '3.3.2. 25% if cancelled 6 days prior to scheduled departure.',
      '3.3.3. 50% if cancelled less than 6 days but more than 72 hours before scheduled departure.',
      '3.3.4. 100% if cancelled less than 72 hours before scheduled departure or for last-minute cancellations due to operational reasons.'
    ]},
    { head: '4. Additional Charges:', items: [
      '4.1. Additional charges may include day detention, night halt, non-flying day charges, watch hour extensions, and other regulatory fees as applicable.',
      '4.2. GST at 18% will be added to all invoices as per Indian Government regulations.',
      '4.3. Day detention charges are INR 50,000 per hour for domestic airports and USD 350 per hour for international airports*, applicable after 4 hours of free waiting time.',
      '4.4. Night halt charges are INR 50,000 per night for domestic flights within India and USD 2,000 per night for international flights*. <span style="font-size:10px">*Note: International charges may vary.</span>'
    ]},
    { head: '5. Special Requirements:', items: [
      '5.1. For foreign nationals traveling to defense airfields, passport details and confirmed timings must be provided at least 10 working days before departure.'
    ]}
  ],
  [
    { head: '6. General Conditions:', items: [
      '6.1. Peacock Jetlines reserves the right to cancel a charter for safety or technical reasons, with a full refund if unable to provide a replacement aircraft. Ferry charges apply if cancellation occurs mid-itinerary.',
      '6.2. USD equivalent rates apply for payments from outside India or for international flights.',
      '6.3. Peacock Jetlines is not liable for passengers carrying contraband or engaging in illegal activities.',
      '6.4. The company reserves the right to modify its offerings in unforeseen circumstances beyond its control.',
      '<span style="display:block;margin-top:18px">By accepting this invoice, you acknowledge and agree to these terms and conditions, constituting a legally-binding agreement between Peacock Jetlines and you.</span>'
    ]}
  ]
];
