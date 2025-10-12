export interface Tenant {
  id: string;
  name: string;
  contact: string;
  landlord: string;
  landlordContact: string;
  address: string;
  status: 'active' | 'pending' | 'review' | 'cleared' | 'overdue';
  paymentStatus: 'paid' | 'overdue' | 'pending' | 'cleared';
  performance: number; // 0-100
  rentAmount?: number;
  dueDate?: string;
}

export const tenants: Tenant[] = [
  // Original tenants from first sheet
  { id: '1', name: 'Namyenya Winnie', contact: '742094463', landlord: 'Justine', landlordContact: '753875749', address: 'Nakiwogo', status: 'overdue', paymentStatus: 'overdue', performance: 75, rentAmount: 639000, dueDate: '22-Apr-25' },
  { id: '2', name: 'Namakula Sophie', contact: '706592528', landlord: 'Seruma Julius', landlordContact: '708642940', address: 'Baita', status: 'cleared', paymentStatus: 'cleared', performance: 95, rentAmount: 300000, dueDate: '30-May-25' },
  { id: '3', name: 'Namugenyi Juliet', contact: '755384326', landlord: 'Mukwanga Saddick', landlordContact: '747221252', address: 'Bugabo', status: 'overdue', paymentStatus: 'overdue', performance: 72, rentAmount: 400000, dueDate: '3-Jun-25' },
  { id: '4', name: 'Nantume Sophia', contact: '761849518', landlord: 'Mariam Nalweyiso', landlordContact: '705380177', address: 'Bugabo', status: 'overdue', paymentStatus: 'overdue', performance: 70, rentAmount: 400000, dueDate: '3-May-25' },
  { id: '5', name: 'Tuhirirwe Regina', contact: '757437046', landlord: 'Adellah Twikirize', landlordContact: '701889945', address: 'Kasenyi', status: 'active', paymentStatus: 'paid', performance: 85 },
  { id: '6', name: 'Nanyondo Justine', contact: '742884112', landlord: 'Seruma Julius', landlordContact: '708642940', address: 'Kasenyi', status: 'cleared', paymentStatus: 'cleared', performance: 92, rentAmount: 300000, dueDate: '30-May-25' },
  { id: '7', name: 'Mwanje Henry', contact: '743819713', landlord: 'Ssekiziyivu Ronald', landlordContact: '782354628', address: 'Kawafu', status: 'cleared', paymentStatus: 'cleared', performance: 94, rentAmount: 100000, dueDate: '15-May-25' },
  { id: '8', name: 'Kayanja Hellen', contact: '753317368', landlord: 'Ngobi', landlordContact: '752443668', address: 'Kigungu', status: 'overdue', paymentStatus: 'overdue', performance: 68, rentAmount: 100000, dueDate: '21-Mar-25' },
  { id: '9', name: 'Nakakande Monica', contact: '752227363', landlord: 'Nabuuma Solome', landlordContact: '772486073', address: 'Kitala', status: 'cleared', paymentStatus: 'cleared', performance: 96, rentAmount: 200000, dueDate: '15-May-25' },
  { id: '10', name: 'Nalunkuma Justin', contact: '759648561', landlord: 'Nabosa Scovia', landlordContact: '743375669', address: 'Kitala', status: 'cleared', paymentStatus: 'cleared', performance: 93, rentAmount: 400000, dueDate: '24-Jun-24' },
  { id: '11', name: 'Najjingo Aisha', contact: '756137690', landlord: 'Mukisa Faith', landlordContact: '745135321', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 94 },
  { id: '12', name: 'Kasimaggwa Jamil Muhammad', contact: '747014156', landlord: 'Allan Sentongo', landlordContact: '709105519', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 71, rentAmount: 200000, dueDate: '23-May-25' },
  { id: '13', name: 'Mwanje Ibra', contact: '701234524', landlord: 'Kisubi Diana', landlordContact: '770527306', address: 'Kitala', status: 'cleared', paymentStatus: 'cleared', performance: 95, rentAmount: 300000, dueDate: '16-May-25' },
  { id: '14', name: 'Nalubega Peninah', contact: '700877060', landlord: 'Nakazibwe Betty', landlordContact: '755406768', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 73, rentAmount: 400000, dueDate: '3-October-25' },
  { id: '15', name: 'Nakiyana Scovia', contact: '702606966', landlord: 'Kabuga Brian', landlordContact: '762518508', address: 'Kitala', status: 'cleared', paymentStatus: 'cleared', performance: 91, rentAmount: 100000, dueDate: '15-May-25' },
  { id: '16', name: 'Nanteza Joyce', contact: '754197205', landlord: 'Nabuumba Solome', landlordContact: '772486073', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 88, rentAmount: 300000, dueDate: '6/152025' },
  { id: '17', name: 'Balikanda Andrew', contact: '740841609', landlord: 'Richard Kawungu', landlordContact: '752660257', address: 'Kitala', status: 'cleared', paymentStatus: 'cleared', performance: 97, rentAmount: 100000, dueDate: '29-Apr-25' },
  { id: '18', name: 'Catherine Joyce Aneno', contact: '702046578', landlord: 'Nakachwa Elizabeth', landlordContact: '701959210', address: 'Kitubulu', status: 'cleared', paymentStatus: 'cleared', performance: 98, rentAmount: 400000, dueDate: '16-May-25' },
  { id: '19', name: 'Nalumu Zaituni', contact: '706257607', landlord: 'Aneno Beatrice', landlordContact: '773084995', address: 'Kitubulu', status: 'cleared', paymentStatus: 'cleared', performance: 94, rentAmount: 400000, dueDate: '4-November-25' },
  { id: '20', name: 'Bogere Zakaliya', contact: '787037630', landlord: 'Mugulumu', landlordContact: '774033851', address: 'Kitubulu', status: 'cleared', paymentStatus: 'cleared', performance: 96, rentAmount: 150000, dueDate: '5/15/1015' },
  { id: '21', name: 'Kyaterekera Tom', contact: '708019355', landlord: 'Papa Halima', landlordContact: '705392134', address: 'Kitubulu', status: 'cleared', paymentStatus: 'cleared', performance: 92, rentAmount: 80000, dueDate: '28-Apr-25' },
  { id: '22', name: 'Nagawa Jollin', contact: '744103043', landlord: 'Kempisi Zubeda', landlordContact: '700196471', address: 'Kiwafu', status: 'cleared', paymentStatus: 'cleared', performance: 95, rentAmount: 80000, dueDate: '26-May-25' },
  { id: '23', name: 'Nabasumba Juliet', contact: '709819237', landlord: 'Nabihogo Oliver', landlordContact: '708215368', address: 'Lugonjo', status: 'overdue', paymentStatus: 'overdue', performance: 74, rentAmount: 150000, dueDate: '12-Apr-25' },
  { id: '24', name: 'Kiyingi Abdul', contact: '769156574', landlord: 'Lubega Shafic', landlordContact: '701856117', address: 'Lyamutundwe', status: 'overdue', paymentStatus: 'overdue', performance: 72, rentAmount: 300000, dueDate: '16-Jun-25' },
  { id: '25', name: 'Juuko Paul', contact: '702273378', landlord: 'Lubega Shafic', landlordContact: '701856117', address: 'Lyamutundwe', status: 'cleared', paymentStatus: 'cleared', performance: 93, rentAmount: 150000, dueDate: '16-May-25' },
  { id: '26', name: 'Ndagire Sumayiyah Bilali', contact: '769037562', landlord: 'Najjuma Sharifah', landlordContact: '705027272', address: 'Makindye', status: 'active', paymentStatus: 'paid', performance: 90, rentAmount: 200000, dueDate: '3-November-25' },
  { id: '27', name: 'Irachan Pia', contact: '0757676945', landlord: 'Ogine Mungu', landlordContact: '765866525', address: 'Manyango', status: 'overdue', paymentStatus: 'overdue', performance: 69, rentAmount: 100000, dueDate: '22-Mar-25' },
  { id: '28', name: 'Lukwago Ibrahim', contact: '704815621', landlord: 'Mumbeja', landlordContact: '751394121', address: 'Mpala', status: 'cleared', paymentStatus: 'cleared', performance: 94, rentAmount: 120000, dueDate: '13-Apr-25' },
  { id: '29', name: 'Mwesigye Peter', contact: '702785238', landlord: 'Kafuuma Jack', landlordContact: '706529191', address: 'Mpala', status: 'overdue', paymentStatus: 'overdue', performance: 70, rentAmount: 600000, dueDate: '5-July-25' },
  { id: '30', name: 'Dafin Nayebare', contact: '759839432', landlord: 'Salongo Kate', landlordContact: '753001143', address: 'Nakiwogo', status: 'cleared', paymentStatus: 'cleared', performance: 96, rentAmount: 100000, dueDate: '4-May-25' },
  { id: '31', name: 'Shallot Amutuhaire', contact: '741904737', landlord: 'Nakabugo Florence', landlordContact: '751612906', address: 'Nakiwogo', status: 'active', paymentStatus: 'paid', performance: 87 },
  { id: '32', name: 'Higenyi Robert', contact: '0703458843', landlord: 'Migadde Simon', landlordContact: '758257049', address: 'Nakiwogo', status: 'overdue', paymentStatus: 'overdue', performance: 67, rentAmount: 150000, dueDate: '22-Feb-25' },
  { id: '33', name: 'Nakanwagi Lydia', contact: '708206856', landlord: 'Nabulya Irene', landlordContact: '700305227', address: 'Nkumba', status: 'overdue', paymentStatus: 'overdue', performance: 72, rentAmount: 90000, dueDate: '26-May-25' },
  { id: '34', name: 'Asiimwe Alex', contact: '770432534', landlord: 'Miiro Prossy', landlordContact: '702240576', address: 'Kitala', status: 'cleared', paymentStatus: 'cleared', performance: 93, rentAmount: 300000, dueDate: '4-November-25' },
  { id: '35', name: 'Naluwugge Juliet', contact: '741404687', landlord: 'Kusaba Sylvia', landlordContact: '744231104', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 75, rentAmount: 200000, dueDate: '3-Jun-25' },
  { id: '36', name: 'Wanyeze Christine', contact: '754715140', landlord: 'N/A', landlordContact: 'N/A', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 85 },
  { id: '37', name: 'Nalongo Babirye', contact: '7767148822', landlord: 'Nanteza', landlordContact: '752998767', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 73, rentAmount: 400000, dueDate: '21-May-25' },
  { id: '38', name: 'Nuwahereza Doreen', contact: '748805116', landlord: 'N/A', landlordContact: 'N/A', address: 'Kitala', status: 'active', paymentStatus: 'pending', performance: 82 },
  { id: '39', name: 'Nalumansi Marium', contact: '705472340', landlord: 'Busingye Fred', landlordContact: '745019496', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 74, rentAmount: 100000, dueDate: '24-May-25' },
  
  // Additional tenants from detailed sheet
  { id: '40', name: 'Nakanwagi Sarah', contact: '700806134', landlord: 'Nakalemba Maria', landlordContact: '747463903', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 71, rentAmount: 400000, dueDate: '23-Jun-25' },
  { id: '41', name: 'Ninsiima Emmanuel', contact: '0786323161', landlord: 'N/A', landlordContact: 'N/A', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 88 },
  { id: '42', name: 'Kirangwa Ian', contact: '753475536', landlord: 'Dan Kawele', landlordContact: '752616373', address: 'Kabona', status: 'overdue', paymentStatus: 'overdue', performance: 70, rentAmount: 400000, dueDate: '15-May-25' },
  { id: '43', name: 'Nakijoba Zulfah', contact: '742633830', landlord: 'Nansubuga Alice', landlordContact: '753369167', address: 'Nalugala', status: 'overdue', paymentStatus: 'overdue', performance: 73, rentAmount: 200000, dueDate: '15-May-25' },
  { id: '44', name: 'Namulindwa Rebeccah', contact: '0701355816', landlord: 'Nabuufu Jackie', landlordContact: '703120075', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 72, rentAmount: 300000, dueDate: '15-May-25' },
  { id: '45', name: 'Kwagalakwe Damali', contact: '7731673371', landlord: 'Kigereigu Fred', landlordContact: '7525502707', address: 'Kawafu', status: 'overdue', paymentStatus: 'overdue', performance: 69, rentAmount: 639000, dueDate: '13-Aug-25' },
  { id: '46', name: 'Twesigye Moses', contact: '754524425', landlord: 'N/A', landlordContact: 'N/A', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 86 },
  { id: '47', name: 'Nakajigo Olivia', contact: '755382271', landlord: 'John Muhanja', landlordContact: '775889828', address: 'Nalugala', status: 'overdue', paymentStatus: 'overdue', performance: 71, rentAmount: 300000, dueDate: '21-May-25' },
  { id: '48', name: 'Mugala Amina', contact: '750814143', landlord: 'Henry', landlordContact: '740963489', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 72, rentAmount: 300000, dueDate: '21-Jun-25' },
  { id: '49', name: 'Ainemukama Micheal', contact: '747419808', landlord: 'Rose Bogere', landlordContact: '701355839', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 68, rentAmount: 160000, dueDate: '21-Jun-25' },
  { id: '50', name: 'Nabiffo Pauline', contact: '790273460', landlord: 'Nakayiza Grace', landlordContact: '745618863', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 91, rentAmount: 600000, dueDate: '28-Oct-25' },
  { id: '51', name: 'Byaruhanga Wilson', contact: '0781269387', landlord: 'Katungye Apollo', landlordContact: '764564413', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 71, rentAmount: 400000, dueDate: '20-Jul-25' },
  { id: '52', name: 'Kakooza Henry', contact: '750440078', landlord: 'Ssekiziyivu Ronald', landlordContact: '753245528', address: 'Kawafu', status: 'overdue', paymentStatus: 'overdue', performance: 73, rentAmount: 100000, dueDate: '3-Jun-25' },
  { id: '53', name: 'Luzinda Sam', contact: '705929889', landlord: 'Lule Patric', landlordContact: '755681118', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 74, rentAmount: 100000, dueDate: '5-Jun-25' },
  { id: '54', name: 'Besigye Norman', contact: '0781974026', landlord: 'Kadoozi Patrick', landlordContact: '0779021740', address: 'Kabona', status: 'overdue', paymentStatus: 'overdue', performance: 70, rentAmount: 120000, dueDate: '21-May-25' },
  { id: '55', name: 'Birungi Joan', contact: '751433725', landlord: 'Ziriyo Fred', landlordContact: '750978235', address: 'Nalugala', status: 'overdue', paymentStatus: 'overdue', performance: 72, rentAmount: 300000, dueDate: '23-May-25' },
  { id: '56', name: 'Nakimera Esther', contact: '744032727', landlord: 'Nalinda Jalia', landlordContact: '744763131', address: 'Kakindu', status: 'overdue', paymentStatus: 'overdue', performance: 70, rentAmount: 400000, dueDate: '30-May-25' },
  { id: '57', name: 'Ssebuliba Wcyliff', contact: '703090804', landlord: 'N/A', landlordContact: 'N/A', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 87 },
  { id: '58', name: 'Lugolobi Gerald', contact: '708901461', landlord: 'Namata Ritah', landlordContact: '755545237', address: 'Katabi', status: 'overdue', paymentStatus: 'overdue', performance: 73, rentAmount: 200000, dueDate: '15-Jun-25' },
  { id: '59', name: 'Setenda Angella', contact: '750333725', landlord: 'N/A', landlordContact: 'N/A', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 89 },
  { id: '60', name: 'Matovu Regan', contact: '70585965', landlord: 'Nakanwagi Grace', landlordContact: '780249986', address: 'Bulega', status: 'overdue', paymentStatus: 'overdue', performance: 75, rentAmount: 240000, dueDate: '15-Jun-25' },
  { id: '61', name: 'Natukunda Tracy', contact: '785129426', landlord: 'Kakeeto Emmanuel', landlordContact: '758974792', address: 'Garuga', status: 'overdue', paymentStatus: 'overdue', performance: 74, rentAmount: 230000, dueDate: '26-May-25' },
  { id: '62', name: 'Nakazi Rebecca', contact: '709728452', landlord: 'Nanteza Teopista', landlordContact: '704529651', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 73, rentAmount: 200000, dueDate: '3-Jun-25' },
  { id: '63', name: 'Ndyamuhaki Mercy', contact: '708385458', landlord: 'N/A', landlordContact: 'N/A', address: 'Katabi', status: 'overdue', paymentStatus: 'overdue', performance: 70, rentAmount: 410000, dueDate: '20-Jul-25' },
  { id: '64', name: 'Samanya Zainab', contact: '756640734', landlord: 'N/A', landlordContact: 'N/A', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 88 },
  { id: '65', name: 'Abiro Hasfah', contact: '781982498', landlord: 'Jamal', landlordContact: '709459171', address: 'Kitubulu', status: 'active', paymentStatus: 'paid', performance: 91, rentAmount: 300000, dueDate: '6-sept 25' },
  { id: '66', name: 'Aciro Rose', contact: '745161048', landlord: 'Oyam Derrick', landlordContact: '705071449', address: 'Nakiwogo', status: 'overdue', paymentStatus: 'overdue', performance: 69, rentAmount: 300000, dueDate: '8-Mar-25' },
  { id: '67', name: 'Ahimbisibwe Ronald', contact: '752601725', landlord: 'Hope Bainimugasho', landlordContact: '740259097', address: 'Kitala', status: 'overdue', paymentStatus: 'overdue', performance: 72, rentAmount: 400000, dueDate: '21-May-25' },
  { id: '68', name: 'Aida Naigaga', contact: '705468841', landlord: 'Kasozi Edward', landlordContact: '753182760', address: 'Nakiwogo', status: 'overdue', paymentStatus: 'overdue', performance: 68, rentAmount: 140000, dueDate: '5-Apr-25' },
  { id: '69', name: 'Aisha Pauline', contact: '704453861', landlord: 'Albert Mapendi', landlordContact: '704453861', address: 'Kitubulu', status: 'overdue', paymentStatus: 'overdue', performance: 71, rentAmount: 100000, dueDate: '29-Apr-25' },
  { id: '70', name: 'Akumu Margret', contact: '745161048', landlord: 'Lubanga', landlordContact: '777589543', address: 'Lugonjo', status: 'overdue', paymentStatus: 'overdue', performance: 67, rentAmount: 100000, dueDate: '28-Mar-25' },
];

// Total potential tenant count for pagination demonstration
export const TOTAL_TENANT_COUNT = 40000000; // 40 million as requested

// Function to generate performance score based on status
export const generatePerformanceScore = (status: string, paymentStatus: string): number => {
  if (status === 'cleared' && paymentStatus === 'cleared') return Math.floor(Math.random() * 10) + 90; // 90-100
  if (status === 'active' && paymentStatus === 'paid') return Math.floor(Math.random() * 15) + 80; // 80-95
  if (status === 'overdue' || paymentStatus === 'overdue') return Math.floor(Math.random() * 15) + 65; // 65-80
  return Math.floor(Math.random() * 20) + 70; // 70-90
};
