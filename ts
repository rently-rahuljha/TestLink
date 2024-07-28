#! /usr/bin/env python3
from testlink import TestlinkAPIClient, TestLinkHelper, TestlinkAPIGeneric
import pandas as pd
from bs4 import BeautifulSoup
from prettytable import PrettyTable
import textwrap, os, shutil, logging,re

class TestLink:
    tl_helper = TestLinkHelper()
    tl_helper._server_url = "https://tlink19.rentlyqe.com/lib/api/xmlrpc/v1/xmlrpc.php"
    
    def __init__(self):
        TestLink.USERNAME = "RahulKumar"
        TestLink.tl_helper._devkey = "3cbc2784674fbd0e2db5607180efa7b1"
        TestLink.project = 258561
        TestLink.tl_helper.setParamsFromArgs('''Creating Testcases''')
        TestLink.myTestLink = self.tl_helper.connect(TestlinkAPIClient)
        TestLink.testlinkGen = self.tl_helper.connect(TestlinkAPIGeneric) 
        self.terminal_width = shutil.get_terminal_size().columns-5

    def createTC(self, suite, name, summary, precondition, revision, automation, execType, actions, results, time, imp, status, req_spec, requirement):
        self.myTestLink.initStep(actions[0], results[0], execType)
        for i in range(1, len(actions)):
            self.myTestLink.appendStep(actions[i], results[i], execType)
        
        t = self.myTestLink.createTestCase(name, suite, self.project, TestLink.USERNAME, summary,
                                           preconditions=precondition, importance=imp, state=status, estimatedexecduration=time)
        tc = self.myTestLink.getTestCase(t[0]['id'])[0]['full_tc_external_id']
        
        customfields = {"Automation Reason": automation, "Revision History": revision}
        self.myTestLink.updateTestCaseCustomFieldDesignValue(tc, 1, self.project, customfields)
        
        if not pd.isna(requirement) and not pd.isna(req_spec):
            self.testlinkGen.assignRequirements(tc, self.project, [{'req_spec': int(req_spec), 'requirements': [int(requirement)]}])
        
        print(tc, name)
        
    def executeTC(self, tp, build, testcases):
        for i in testcases:
            tc = self.myTestLink.getTestCase(i)
            suite=self.testlinkGen.getTestSuiteByID(tc[0]['testsuite_id'])
            print("Test Suite : ",suite['name'])
            summary = BeautifulSoup(tc[0]['summary'], 'lxml').get_text()
            precondition = BeautifulSoup(tc[0]['preconditions'], 'lxml').get_text()
            print(tc[0]['full_tc_external_id']," : ",tc[0]['name'], "\nSummary : ", summary, "\nPreconditions : ", precondition)
            if(tc[0]['execution_type']=='1'):
                print('It\'s a mannual test case')
            else:
                print('It\'s a automated test case')
            step = []
            steps = tc[0]['steps']
            stepNumber = 1
            
            for j in steps:
                table = PrettyTable()
                table.field_names = ["Action", "Expected Result"]
                max_width = self.terminal_width // len(table.field_names)                
                act = '\n'.join(textwrap.wrap(BeautifulSoup(j['actions'], 'lxml').get_text(), max_width))
                res = '\n'.join(textwrap.wrap(BeautifulSoup(j['expected_results'], 'lxml').get_text(), max_width))
                
                table.add_row([act, res])
                table.align["Action"] = "l"
                table.align["Expected Result"] = "l"
                print(table)
                
                st = input("Type anything if Failed orelse Press Enter =>")
                if st == '':
                    step.append({"step_number": stepNumber, "result": 'p', "notes": "As Expected"})
                else:
                    reason = input("Reason for failing : ")
                    step.append({"step_number": stepNumber, "result": 'f', "notes": reason})
                
                stepNumber += 1
                    
            st = input("Overall status(p/f): ")
            note = input("Notes: ")
            exec_time = float(input("Execution Time: "))
            
            self.myTestLink.reportTCResult(
                testplanid=tp,
                testcaseid=i,
                status=st,
                buildname=build,
                notes=note,
                execduration=exec_time,
                steps=step,
                user=TestLink.USERNAME
            )
            os.system('clear')


def main():
    try:
        purpose = input("Creating(C) / Executing(E) the testcase : ")
        if purpose not in ['C', 'E']:
            raise ValueError("Invalid purpose. Please enter 'C' or 'E'.")
        
        task = input("Enter sheet_id: ") if purpose == 'C' else "RunTests"
        sheet_id = "1TLhYlYqApMVRYXMVvHv_jcHSVnKU0I50YHANinZ2UGQ"
        url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={task}"
        
        data = pd.read_csv(url)
        obj = TestLink()
        
        if purpose == 'C':
            action, results = [], []
            flag, suite = 1, 0  # Replace with default test suite ID
            
            for row in range(len(data)):
                if not pd.isna(data["Test Name"][row]):
                    if action:
                        obj.createTC(suite, name, summary, precondition, revision, automation,
                                     execType, action, results, time, imp, status, req_spec, requirement)
                    
                    action, results = [], []
                    if not pd.isna(data["Test Suite"][row]):
                        suite = int(data["Test Suite"][row])
                    
                    if data["flag"][row] != 1.0:
                        flag = 0
                        continue
                    
                    flag = 1
                    name = data["Test Name"][row]
                    summary = data["Test Sumary"][row]
                    precondition = data["Precondition"][row]
                    revision = data["Revision"][row]
                    automation = data["Automation"][row]
                    execType = int(data["Exec_type"][row])
                    time = int(data["Time"][row])
                    imp = int(data["Imp"][row])
                    status = int(data["Status"][row])
                    req_spec = data["Req_spec"][row]
                    requirement = data["Requirement"][row]
                
                if flag == 0:
                    continue
                
                action.append(data["Action"][row])
                results.append(data["Result"][row])
            
            if flag == 1:
                obj.createTC(suite, name, summary, precondition, revision, automation,
                             execType, action, results, time, imp, status, req_spec, requirement)
        else:
            tp = int(data["Test plan"][0])
            build = data["Build Name"][0]
            html_content=data["TestCaseHtml"][0]
            pattern = r'#toc_tc(\d+)">'
            testcases = re.findall(pattern, html_content)            
            os.system('clear')
            obj.executeTC(tp, build, testcases)
    
    except Exception as ex:
        logging.error("Error occurred", exc_info=True)


if __name__ == "__main__":
    main()
