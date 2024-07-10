#! /usr/bin/env python3
from testlink import TestlinkAPIClient, TestLinkHelper, TestlinkAPIGeneric
import pandas as pd

teamname= input("Enter Teamname: ")
task=input("Enter sheet_id: ")

class TestLink:
    tl_helper = TestLinkHelper()
    tl_helper._server_url = "https://tlink19.rentlyqe.com/lib/api/xmlrpc/v1/xmlrpc.php"
    
    def __init__(self, details,):
        #set basic auth details and project id
        detailList=details.split('-')
        TestLink.USERNAME = detailList[0]
        TestLink.tl_helper._devkey = detailList[1]
        TestLink.project = int(detailList[2])
        TestLink.tl_helper.setParamsFromArgs('''Creating Testcases''')
        TestLink.myTestLink = self.tl_helper.connect(TestlinkAPIClient)
        TestLink.testlinkGen = self.tl_helper.connect(TestlinkAPIGeneric) 
    
    def createTC(self, suite, name, summary, precondition, revision, automation, execType, actions, results, time, imp, status, req_spec, requirement):
        TestLink.myTestLink.initStep(actions[0], results[0], execType)
        for i in range(1,len(actions)):
            TestLink.myTestLink.appendStep(actions[i], results[i], execType)
        print(name, suite)
        t=TestLink.myTestLink.createTestCase(name, suite, TestLink.project, TestLink.USERNAME, summary,
            preconditions=precondition, importance=imp, state=status, estimatedexecduration=time)
        t=t[0]['additionalInfo']['external_id']
        if(self.project==258561):
            tc='RM-'+t
        customfields={"Automation Reason" : automation, "Revision History" : revision}
        TestLink.myTestLink.updateTestCaseCustomFieldDesignValue(tc, 1, TestLink.project, customfields)
        if(not pd.isna(requirement) and not pd.isna(req_spec)):
            TestLink.testlinkGen.assignRequirements(tc, self.project,[{'req_spec': int(req_spec), 'requirements': [int(requirement)]}])      


if(teamname=="hydra"):
    sheet_id = "1TLhYlYqApMVRYXMVvHv_jcHSVnKU0I50YHANinZ2UGQ"
elif(teamname=="spc"):
    sheet_id="kjhgfdghjkhgfghjgfdghjkjhgfhjhgfdfhjgfgdg"

url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={task}"
# Read the CSV data from the URL using pandas
data = pd.read_csv(url)
#start of main code
obj=TestLink(data["User-DevKey-Project"][0])
action=[]
results=[]
flag=1
suite=0#Replace with default test suite ID.
for row in range(0, len(data)):
    if(not pd.isna(data["Test Name"][row])):
        if(len(action)!=0):
            obj.createTC(suite, name, summary, precondition, 
                        revision, automation, execType, 
                        action, results,
                        time, imp, status,
                        req_spec, requirement)
        action=[]
        results=[]
        if(not pd.isna(data["Test Suite"][row])):
            suite=int(data["Test Suite"][row])
        if(data["flag"][row]!=1.0):
            flag=0
            continue
        flag=1
        name=data["Test Name"][row]
        summary=data["Test Sumary"][row]
        precondition=data["Precondition"][row]
        revision=data["Revision"][row]
        automation=data["Automation"][row]
        execType=int(data["Exec_type"][row])
        time=int(data["Time"][row])
        imp=int(data["Imp"][row])
        status=int(data["Status"][row])
        req_spec=data["Req_spec"][row]
        requirement=data["Requirement"][row]
    if(flag==0):
        continue
    action.append(data["Action"][row])
    results.append(data["Result"][row])
if(flag==1):
    obj.createTC(suite, name, summary, precondition, 
                        revision, automation, execType, 
                        action, results,
                        time, imp, status,
                        req_spec, requirement)