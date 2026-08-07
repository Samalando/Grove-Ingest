//
//  ContentView.swift
//  ui
//
//  Created by Sam LeBlanc on 8/5/26.
//

import SwiftUI

struct ContentView: View {
    @State private var Option: String = "Import option"
    @State private var startDate: Date = Date()
    @State private var endDate: Date = Date()
    @State private var next: Bool = false
    @State private var spike: String = "Spike"
    @State private var password: String = String()
    @State private var gitHubUser: String = String()
    
    struct emailTags: Identifiable, Hashable {
        let name: String
        let id = UUID()
        let visual: String
    }


    private let emails = [
        emailTags(name: "INBOX", visual: "Inbox"),
        emailTags(name: "SPAM", visual: "Spam"),
        emailTags(name: "TRASH", visual: "Trash"),
        emailTags(name: "UNREAD", visual: "Unread"),
        emailTags(name: "STARRED", visual: "Starred"),
        emailTags(name: "IMPORTANT", visual: "Important"),
        emailTags(name: "CATEGORY_PRIMARY", visual: "Primary category"),
        emailTags(name: "CATEGORY_SOCIAL", visual: "Social Category"),
        emailTags(name: "CATEGORY_PROMOTIONS", visual: "Promotional Category"),
        emailTags(name: "CATEGORY_UPDATES", visual: "Update Category"),
        emailTags(name: "CATEGORY_FORUMS", visual: "Forum Category")
    ]


    @State private var multiSelection = Set<UUID>()

    var body: some View {
        VStack {
            Menu(Option){
                Menu("Github") {
                    Button("Pull Requests"){
                        Option = "Pull Requests"

                    }
                    Button("Commits"){
                        Option = "Commits"

                    }
                }
                  Menu("Google suite") {
                      Button("Gmail"){
                          Option = "Gmail"

                      }
                      Button("Google Calendar") {
                          Option = "Google Calendar"

                      }
                  }
            }
            if Option == "Google Calendar" {
                DatePicker(selection: $startDate, displayedComponents: [.date]) {
                    Text("Start date of ingest")
                }
                .datePickerStyle(.stepperField)
                .fixedSize()
                DatePicker(selection: $endDate, displayedComponents: [.date]) {
                    Text("End date of ingest")
                }
                .datePickerStyle(.stepperField)
                .fixedSize()
            }
            if Option == "Gmail" {
                Text("Choose what email categories you'd like to include:")
                List(emails) { tag in
                    Button {
                        if multiSelection.contains(tag.id) {
                            multiSelection.remove(tag.id)
                        } else {
                            multiSelection.insert(tag.id)
                        }
                    } label: {
                        HStack {
                            Text(tag.visual)
                            Spacer()
                            if multiSelection.contains(tag.id) {
                                Image(systemName: "checkmark.circle")
                                    .transition(.symbolEffect(.drawOn.byLayer))
                                    .symbolRenderingMode(.palette)
                                    .foregroundStyle(.black, .blue)
                            }
                        }
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
                .frame(maxWidth: 280)
                .navigationTitle("Email tags")
            }
            
            if Option == "Commits" || Option == "Pull Requests" {
                TextField("Please put youhtur hreuheour username", text: $gitHubUser)
            }
            if next{
                Text("Select your spike:")
                Menu(spike){
                    Button("Composio"){
                        spike = "Composio"
                    }
                    .help("Recommeneded!")
                    Button("Native"){
                        spike = "Native"
                    }
                    .help("⚠️ May or may not exist!")
                }
            }
            if spike == "Composio"{
                SecureField("ak_XXX...", text: $password)
                    .onSubmit {
                    }
            }
            if password != String(){
                //output path thing that i dont want to do
                Button("Run ingest"){
                    
                }
            }
            if Option != "Import option"{
                if spike == "Spike"{
                    Button("Next..."){
                        next = true
                    }
                }
            }

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }
}


#Preview {
    ContentView()
}
