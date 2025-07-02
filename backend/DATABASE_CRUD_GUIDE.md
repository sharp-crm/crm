# 🗃️ Sharp CRM Database Manual CRUD Guide

## 🚀 Two Ways to Manually CRUD Your Database

### **Method 1: Interactive Interface (Recommended for Complex Operations)**

```bash
node crud-db.js
```

**Features:**
- 📖 **READ**: Browse all tables and view records
- ➕ **CREATE**: Step-by-step guided record creation with proper field templates
- ✏️ **UPDATE**: Select and modify specific fields in existing records
- 🗑️ **DELETE**: Safe deletion with confirmation prompts
- 📊 **STATS**: Overview of all table record counts

**Perfect for:**
- Creating complex records with multiple fields
- Updating specific fields
- Safe deletion operations
- Exploring the database structure

---

### **Method 2: Quick Command Line (Fast Operations)**

```bash
node quick-crud.js <command> <parameters>
```

**Available Commands:**

#### 📖 Read Operations
```bash
node quick-crud.js read <table>
node quick-crud.js read Users
node quick-crud.js read Contacts
node quick-crud.js read Leads
```

#### ➕ Create Operations
```bash
# Create Contact
node quick-crud.js create-contact <firstName> <lastName> <email> <company>
node quick-crud.js create-contact Alice Johnson alice@techcorp.com TechCorp

# Create Lead
node quick-crud.js create-lead <firstName> <lastName> <email> <company>
node quick-crud.js create-lead Bob Smith bob@newcompany.com "New Company Inc"

# Create Deal
node quick-crud.js create-deal <title> <amount> <contactId>
node quick-crud.js create-deal "Big Deal" 50000 contact-id-here

# Create Task
node quick-crud.js create-task <title> <description> <assignedTo>
node quick-crud.js create-task "Follow up" "Call the client" user-id-here
```

#### 🗑️ Delete Operations
```bash
node quick-crud.js delete <table> <id>
node quick-crud.js delete Contacts contact-id-here
node quick-crud.js delete Leads lead-id-here
```

#### 📊 Statistics
```bash
node quick-crud.js stats
```

---

## 📋 Available Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `Users` | System users | userId, email, role, firstName, lastName |
| `Contacts` | Customer contacts | id, firstName, lastName, email, company |
| `Leads` | Sales leads | id, firstName, lastName, email, status, source |
| `Deals` | Sales opportunities | id, title, amount, contactId, status |
| `Tasks` | Work items | id, title, description, assignedTo, status |
| `Accounts` | Customer accounts | id, name, description |
| `Subsidiaries` | Company subsidiaries | id, name, description |
| `Dealers` | Business partners | id, name, description |
| `Notifications` | System notifications | id, name, description |
| `Meetings` | Scheduled meetings | id, name, description |
| `Reports` | Generated reports | id, name, description |

---

## 🎯 Common CRUD Workflows

### **1. Create a Complete Customer Pipeline**
```bash
# 1. Create a contact
node quick-crud.js create-contact Sarah Wilson sarah@bigcorp.com "BigCorp Ltd"

# 2. Create a lead from that contact
node quick-crud.js create-lead Sarah Wilson sarah@bigcorp.com "BigCorp Ltd"

# 3. Create a deal (use the contact ID from step 1)
node quick-crud.js create-deal "BigCorp Enterprise Package" 75000 <contact-id>

# 4. Create a follow-up task
node quick-crud.js create-task "Prepare proposal" "Create enterprise package proposal for BigCorp" <user-id>
```

### **2. Quick Data Exploration**
```bash
# See all table counts
node quick-crud.js stats

# Browse specific tables
node quick-crud.js read Users
node quick-crud.js read Contacts
node quick-crud.js read Deals
```

### **3. Data Cleanup**
```bash
# List records to get IDs
node quick-crud.js read Contacts

# Delete unwanted records
node quick-crud.js delete Contacts unwanted-contact-id
```

---

## 🔧 Advanced Operations

### **Using the Interactive Interface for Complex Updates**

1. Start interactive mode: `node crud-db.js`
2. Choose option **3** (UPDATE)
3. Select the table
4. Pick the record to modify
5. Specify the field and new value

### **Viewing Current Database State**
```bash
# Quick overview
node quick-crud.js stats

# Detailed view (also shows existing IDs for linking)
node view-db.js
```

---

## 🎨 Sample Data Creation

### **Create Sample Users**
```bash
node crud-db.js
# Choose CREATE -> Users -> Fill in details
```

### **Create Sample Business Data**
```bash
# Sample contact
node quick-crud.js create-contact Mike Chen mike@startupxyz.com "StartupXYZ"

# Sample lead
node quick-crud.js create-lead Emma Davis emma@retailchain.com "Retail Chain Co"

# Sample deal
node quick-crud.js create-deal "Retail Chain Integration" 25000 <contact-id>
```

---

## 🛡️ Safety Features

- **Confirmation prompts** for delete operations
- **Automatic timestamps** (createdAt, updatedAt) on all records
- **UUID generation** for all record IDs
- **Error handling** for invalid operations
- **Table validation** to prevent typos

---

## 🐳 Prerequisites

1. **Docker DynamoDB running**:
   ```bash
   docker ps
   # Should show container 'confident_hopper' running on port 8000
   ```

2. **Dependencies installed**:
   ```bash
   npm install
   ```

3. **Database initialized**:
   ```bash
   npm run init-db
   ```

---

## 🎉 You're Ready!

Your database is fully accessible for manual CRUD operations. Use the **interactive interface** for complex operations and the **quick commands** for fast data manipulation.

**Happy CRUDing! 🚀** 