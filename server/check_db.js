const { sequelize } = require('./config/database');
const { Contact, Opportunity, Task, User } = require('./models');

async function checkDatabase() {
  try {
    // Check total counts
    const totalOpportunities = await Opportunity.count();
    const totalContacts = await Contact.count();
    const totalTasks = await Task.count();
    const totalUsers = await User.count();
    
    console.log('=== TOPLAM KAYIT SAYILARI ===');
    console.log(`Toplam Fırsatlar: ${totalOpportunities}`);
    console.log(`Toplam Kişiler: ${totalContacts}`);
    console.log(`Toplam Görevler: ${totalTasks}`);
    console.log(`Toplam Kullanıcılar: ${totalUsers}`);
    
    // Check opportunities with USERID
    const assignedOpportunities = await Opportunity.count({
      where: {
        USERID: { [require('sequelize').Op.ne]: null }
      }
    });
    
    const unassignedOpportunities = await Opportunity.count({
      where: {
        USERID: null
      }
    });
    
    console.log('\n=== FIRSAT ATAMA DURUMU ===');
    console.log(`Atanmış Fırsatlar: ${assignedOpportunities}`);
    console.log(`Atanmamış Fırsatlar: ${unassignedOpportunities}`);
    
    // Check opportunities with FINALTOTAL > 0
    const opportunitiesWithAmount = await Opportunity.count({
      where: {
        FINALTOTAL: { [require('sequelize').Op.gt]: '0' }
      }
    });
    
    console.log(`\nTutar > 0 olan Fırsatlar: ${opportunitiesWithAmount}`);
    
    // Check opportunities with status type
    const opportunitiesWithStatus = await Opportunity.count({
      where: {
        STATUSTYPEID: { [require('sequelize').Op.ne]: null }
      }
    });
    
    console.log(`Durum tipi olan Fırsatlar: ${opportunitiesWithStatus}`);
    
    // Check users
    const users = await User.findAll({
      attributes: ['ID', 'NAME', 'EMAIL', 'ORGANIZATION']
    });
    
    console.log('\n=== KULLANICILAR ===');
    users.forEach(user => {
      console.log(`ID: ${user.ID}, İsim: ${user.NAME}, Email: ${user.EMAIL}, Organizasyon: ${user.ORGANIZATION}`);
    });
    
    // Check sample opportunities
    const sampleOpportunities = await Opportunity.findAll({
      limit: 5,
      attributes: ['ID', 'NAME', 'FINALTOTAL', 'STATUSTYPEID', 'OWNERUSERID', 'USERID']
    });
    
    console.log('\n=== ÖRNEK FIRSATLAR ===');
    sampleOpportunities.forEach(opp => {
      console.log(`ID: ${opp.ID}, Başlık: ${opp.NAME}, Tutar: ${opp.FINALTOTAL}, Durum: ${opp.STATUSTYPEID}, Sahip: ${opp.OWNERUSERID}, Atanan: ${opp.USERID}`);
    });
    
  } catch (error) {
    console.error('Veritabanı kontrolü hatası:', error);
  } finally {
    await sequelize.close();
  }
}

checkDatabase();