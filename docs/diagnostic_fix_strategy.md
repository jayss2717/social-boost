# 🔍 Diagnostic & Fix Strategy for Onboarding Completion Failure

## 🎯 **Current Issue**
- Onboarding completion API returns `503 (Service Unavailable)` with `{error: 'Database operation failed'}`
- Database reads work, but writes fail
- Progress bar not updating visually

## 📋 **Systematic Diagnostic Steps**

### **Step 1: Run Comprehensive Diagnostic**
```bash
curl "https://socialboost-blue.vercel.app/api/test/diagnostic" | jq .
```

### **Step 2: Check Each Possible Cause**

#### **A. Environment Variables**
- ✅ DATABASE_URL exists
- ✅ NODE_ENV is production
- ✅ VERCEL_URL is set

#### **B. Database Connection**
- ✅ Raw queries work
- ✅ Prisma client initialized
- ✅ Connection pool working

#### **C. Schema Validation**
- ✅ Merchant table exists
- ✅ All required columns present
- ✅ Data types match

#### **D. Write Permissions**
- ❌ Test merchant creation
- ❌ Upsert operation
- ❌ JSON field handling

#### **E. Specific Operation Test**
- ❌ onboardingData JSON field
- ❌ Unique constraint on shop
- ❌ Required field validation

## 🔧 **Fix Strategies by Cause**

### **1. Database Write Permission Issues**
**Symptoms:** Can read but not write
**Fixes:**
- Check Supabase connection pooler settings
- Verify DATABASE_URL includes `?pgbouncer=true`
- Test with direct connection (bypass pgbouncer)
- Check connection limits in Supabase dashboard

### **2. Schema Constraint Violations**
**Symptoms:** Specific field errors
**Fixes:**
- Verify all required fields are provided
- Check unique constraints on shop field
- Validate JSON field format for onboardingData
- Run database migrations if needed

### **3. JSON Field Issues**
**Symptoms:** onboardingData field causing errors
**Fixes:**
- Ensure onboardingData is valid JSON
- Check if field is properly defined in schema
- Test with simpler data structure
- Verify Prisma JSON field handling

### **4. Deployment Issues**
**Symptoms:** Old code still running
**Fixes:**
- Force Vercel redeployment
- Clear Vercel cache
- Check deployment logs
- Verify environment variables are set

### **5. Connection Pool Issues**
**Symptoms:** Intermittent failures
**Fixes:**
- Increase connection pool size
- Add connection retry logic
- Use connection pooling configuration
- Implement connection health checks

## 🚀 **Immediate Actions**

### **Action 1: Test Diagnostic Endpoint**
```bash
# Wait 2-3 minutes for deployment, then:
curl "https://socialboost-blue.vercel.app/api/test/diagnostic" | jq .
```

### **Action 2: Check Vercel Environment Variables**
- Go to Vercel dashboard
- Verify DATABASE_URL is set correctly
- Check for any missing environment variables

### **Action 3: Test Database Connection**
```bash
curl "https://socialboost-blue.vercel.app/api/test/prisma-debug" | jq .
```

### **Action 4: Check Supabase Dashboard**
- Monitor connection usage
- Check for any errors or limits
- Verify database is accessible

## 🎯 **Most Likely Root Causes**

### **High Probability (80%)**
1. **JSON Field Validation** - onboardingData field causing schema validation errors
2. **Unique Constraint** - Shop field already exists in database
3. **Missing Required Fields** - Some required fields not provided in upsert

### **Medium Probability (15%)**
4. **Connection Pool Limits** - Too many concurrent connections
5. **Deployment Not Updated** - Still using old code

### **Low Probability (5%)**
6. **Database Server Issues** - Supabase experiencing problems
7. **Network Issues** - Vercel can't reach Supabase

## 🔄 **Next Steps After Diagnostic**

1. **If JSON field issue:** Simplify onboardingData structure
2. **If unique constraint:** Handle existing merchant properly
3. **If missing fields:** Add all required fields to upsert
4. **If connection pool:** Implement retry logic with backoff
5. **If deployment:** Force redeploy and clear cache

## 📊 **Success Criteria**

- ✅ Diagnostic endpoint returns all tests passing
- ✅ Onboarding completion API returns success
- ✅ Merchant data persists in database
- ✅ Progress bar updates visually
- ✅ No more 503 errors
- ✅ Onboarding flow completes without looping 